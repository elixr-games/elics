import type { Component, ComponentMask } from './component.js';

import BitSet from './bit-set.js';
import type { ComponentManager } from './component-manager.js';
import type { EntityManager } from './entity-manager.js';
import type { QueryManager } from './query-manager.js';
import {
	DataArrayToType,
	DataType,
	TypeValueToType,
	type TypedArray,
	TypedArrayMap,
	Types,
} from './types.js';
import { ErrorMessages, assertCondition } from './checks.js';

export type VectorKeys<C extends Component<any>> = {
	[K in keyof C['schema']]: DataArrayToType<
		C['schema'][K]['type']
	> extends TypedArray
		? K
		: never;
}[keyof C['schema']];

export class Entity {
	public bitmask: ComponentMask = new BitSet();

	public active = true;

	private vectorViews: Map<Component<any>, Map<string, TypedArray>> = new Map();

	constructor(
		protected entityManager: EntityManager,
		protected queryManager: QueryManager,
		protected componentManager: ComponentManager,
		public readonly index: number,
	) {}

	addComponent<C extends Component<any>>(
		component: C,
		initialData: Partial<{
			[K in keyof C['schema']]: TypeValueToType<C['schema'][K]['type']>;
		}> = {},
	): this {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			component.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			component,
		);
		this.bitmask.orInPlace(component.bitmask!);
		this.componentManager.attachComponentToEntity(
			this.index,
			component,
			initialData,
		);
		component.onAttach(component.data, this.index);
		this.queryManager.updateEntity(this, component);
		return this;
	}

	removeComponent(component: Component<any>): this {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			component.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			component,
		);
		this.bitmask.andNotInPlace(component.bitmask!);
		this.vectorViews.delete(component);
		component.onDetach(component.data, this.index);
		this.queryManager.updateEntity(this, component);
		return this;
	}

	hasComponent(component: Component<any>): boolean {
		assertCondition(
			component.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			component,
		);
		return this.bitmask.intersects(component.bitmask!);
	}

	getComponents(): Component<any>[] {
		const bitArray = this.bitmask.toArray();
		return bitArray.map(
			(typeId) => this.componentManager.getComponentByTypeId(typeId)!,
		);
	}

	getValue<C extends Component<any>, K extends keyof C['schema']>(
		component: C,
		key: K,
	): C['schema'][K]['type'] extends 'Entity'
		? Entity | undefined
		: TypeValueToType<C['schema'][K]['type']> {
		// allow runtime access with invalid keys, return undefined
		const schemaEntry = (component.schema as any)[key as string];
		if (!schemaEntry) {
			return undefined as TypeValueToType<C['schema'][K]['type']>;
		}

		const data = (component.data as any)[key]?.[this.index];
		const type = schemaEntry.type as DataType;

		if (type === Types.Boolean) {
			return Boolean(data) as TypeValueToType<C['schema'][K]['type']>;
		}

		if (type === Types.Entity) {
			return this.entityManager.getEntityByIndex(data) as TypeValueToType<
				C['schema'][K]['type']
			>;
		}

		return data as TypeValueToType<C['schema'][K]['type']>;
	}

	setValue<C extends Component<any>, K extends keyof C['schema']>(
		component: C,
		key: K,
		value: TypeValueToType<C['schema'][K]['type']>,
	): void {
		const componentData = component.data[key];
		const type = component.schema[key].type as DataType;
		if (type === Types.Entity) {
			componentData[this.index] = (value as any as Entity).index;
		} else {
			componentData[this.index] = value as any;
		}
	}

	getVectorView<C extends Component<any>, K extends VectorKeys<C>>(
		component: C,
		key: K,
	): DataArrayToType<C['schema'][K]['type']> {
		const keyStr = key as string;
		const cachedVectorView = this.vectorViews.get(component)?.get(keyStr);
		if (cachedVectorView) {
			return cachedVectorView as DataArrayToType<C['schema'][K]['type']>;
		} else {
			const componentData = component.data[key] as TypedArray;
			const type = component.schema[key].type as DataType;
			const length = TypedArrayMap[type].length;
			const offset = this.index * length;
			const vectorView = componentData.subarray(offset, offset + length);
			if (!this.vectorViews.has(component)) {
				this.vectorViews.set(component, new Map());
			}
			this.vectorViews.get(component)!.set(keyStr, vectorView as TypedArray);
			return vectorView as DataArrayToType<C['schema'][K]['type']>;
		}
	}

	destroy(): void {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		this.active = false;

		// Batch component cleanup before query updates
		let bits = this.bitmask.bits;
		while (bits !== 0) {
			const i = Math.floor(Math.log2(bits & -bits));
			const c = this.componentManager.getComponentByTypeId(i)!;
			c.onDetach(c.data, this.index);
			bits &= bits - 1;
		}

		this.bitmask.bits = 0;
		this.vectorViews.clear();
		this.queryManager.resetEntity(this);
		this.entityManager.releaseEntityInstance(this);
	}
}

export type EntityConstructor = {
	new (
		_em: EntityManager,
		_qm: QueryManager,
		_cm: ComponentManager,
		_idx: number,
	): Entity;
};

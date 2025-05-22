import type { Component, ComponentMask } from './Component.js';

import BitSet from './BitSet.js';
import type { ComponentManager } from './ComponentManager.js';
import type { EntityManager } from './EntityManager.js';
import type { QueryManager } from './QueryManager.js';
import {
	DataArrayToType,
	DataType,
	TypedArrayMap,
	TypeValueToType,
	type TypedArray,
	Types,
} from './Types.js';
import { assertCondition, ErrorMessages } from './Checks.js';

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
		this.queryManager.updateEntity(this, component);
		component.onAttach(component.data, this.index);
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
		this.queryManager.updateEntity(this, component);
		component.onDetach(component.data, this.index);
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
	): TypeValueToType<C['schema'][K]['type']> {
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
		this.entityManager.releaseEntityInstance(this);
		this.active = false;
		const bits = this.bitmask.bits;
		for (let i = 0; i < 32; i++) {
			if (bits & (1 << i)) {
				const c = this.componentManager.getComponentByTypeId(i)!;
				c.onDetach(c.data, this.index);
			}
		}
		this.bitmask.bits = 0;
		this.vectorViews.clear();
		this.queryManager.resetEntity(this);
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

import type { Component, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import type { ComponentManager } from './ComponentManager.js';
import type { EntityManager } from './EntityManager.js';
import type { QueryManager } from './QueryManager.js';
import {
	DataType,
	TypedArrayMap,
	TypedSchema,
	TypeValueToType,
	type TypedArray,
} from './Types.js';
import { assertCondition, ErrorMessages } from './Checks.js';

export class Entity {
	public bitmask: ComponentMask = new BitSet();
	public active = true;
	private vectorViews: Map<
		Component<TypedSchema<DataType>>,
		Map<string, TypedArray>
	> = new Map();

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
		this.bitmask = this.bitmask.or(component.bitmask!);
		this.componentManager.attachComponentToEntity(
			this.index,
			component,
			initialData,
		);
		this.queryManager.updateEntity(this);
		component.onAttach(this.index);
		return this;
	}

	removeComponent(component: Component<any>): this {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			component.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			component,
		);
		this.bitmask = this.bitmask.andNot(component.bitmask!);
		this.queryManager.updateEntity(this);
		component.onDetach(this.index);
		return this;
	}

	hasComponent(component: Component<any>): boolean {
		assertCondition(
			component.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			component,
		);
		return !this.bitmask.and(component.bitmask!).isEmpty();
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
		return component.data[key]?.[this.index] as TypeValueToType<
			C['schema'][K]['type']
		>;
	}

	setValue<C extends Component<any>, K extends keyof C['schema']>(
		component: C,
		key: K,
		value: TypeValueToType<C['schema'][K]['type']>,
	): void {
		const componentData = component.data[key];
		componentData[this.index] = value;
	}

	getVectorView<S extends TypedSchema<DataType>, C extends Component<S>>(
		component: C,
		key: keyof C['schema'],
	) {
		key = key as string;
		const cachedVectorView = this.vectorViews.get(component)?.get(key);
		if (cachedVectorView) {
			return cachedVectorView;
		} else {
			const componentData = component.data[key] as TypedArray;
			const type = component.schema[key].type;
			const length = TypedArrayMap[type].length;
			const offset = this.index * length;
			const vectorView = componentData.subarray(offset, offset + length);
			if (!this.vectorViews.has(component)) {
				this.vectorViews.set(component, new Map());
			}
			this.vectorViews.get(component)!.set(key, vectorView);
			return vectorView;
		}
	}

	destroy(): void {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		this.entityManager.releaseEntityInstance(this);
		this.active = false;
		const bitArray = this.bitmask.toArray();
		for (const typeId of bitArray) {
			this.componentManager.getComponentByTypeId(typeId)!.onDetach(this.index);
		}
		this.bitmask = new BitSet();
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

import type { ComponentConstructor, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import type { ComponentManager } from './ComponentManager.js';
import type { EntityManager } from './EntityManager.js';
import type { QueryManager } from './QueryManager.js';
import { TypedArrayMap, type TypedArray } from './Types.js';
import { assertCondition, ErrorMessages } from './Checks.js';

export interface EntityLike {
	bitmask: ComponentMask;
	active: boolean;
	readonly index: number;

	addComponent(
		componentClass: ComponentConstructor,
		initialData?: { [key: string]: any },
	): this;

	removeComponent(componentClass: ComponentConstructor): void;

	hasComponent(componentClass: ComponentConstructor): boolean;

	getValue(componentClass: ComponentConstructor, key: string): any;

	setValue(componentClass: ComponentConstructor, key: string, value: any): void;

	getVectorView(componentClass: ComponentConstructor, key: string): TypedArray;

	destroy(): void;
}

export const PRIVATE = Symbol('@elics/entity');

export class Entity {
	public bitmask: ComponentMask = new BitSet();
	public active = true;
	private vectorViews: Map<ComponentConstructor, Map<string, TypedArray>> =
		new Map();

	constructor(
		protected entityManager: EntityManager,
		protected queryManager: QueryManager,
		protected componentManager: ComponentManager,
		public readonly index: number,
	) {}

	addComponent(
		componentClass: ComponentConstructor,
		initialData: { [key: string]: any } = {},
	): this {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			componentClass.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			componentClass,
		);
		this.bitmask = this.bitmask.or(componentClass.bitmask!);
		this.componentManager.attachComponentToEntity(
			this.index,
			componentClass,
			initialData,
		);
		this.queryManager.updateEntity(this);
		return this;
	}

	removeComponent(componentClass: ComponentConstructor): void {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			componentClass.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			componentClass,
		);
		this.bitmask = this.bitmask.andNot(componentClass.bitmask!);
		this.queryManager.updateEntity(this);
	}

	hasComponent(componentClass: ComponentConstructor): boolean {
		assertCondition(
			componentClass.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			componentClass,
		);
		return !this.bitmask.and(componentClass.bitmask!).isEmpty();
	}

	getValue(componentClass: ComponentConstructor, key: string): any {
		return componentClass.data[key]?.[this.index];
	}

	setValue(
		componentClass: ComponentConstructor,
		key: string,
		value: any,
	): void {
		const componentData = componentClass.data[key];
		componentData[this.index] = value;
	}

	getVectorView(componentClass: ComponentConstructor, key: string) {
		const cachedVectorView = this.vectorViews.get(componentClass)?.get(key);
		if (cachedVectorView) {
			return cachedVectorView;
		} else {
			const componentData = componentClass.data[key] as TypedArray;
			const length = TypedArrayMap[componentClass.schema[key].type].length;
			const offset = this.index * length;
			const vectorView = componentData.subarray(offset, offset + length);
			if (!this.vectorViews.has(componentClass)) {
				this.vectorViews.set(componentClass, new Map());
			}
			this.vectorViews.get(componentClass)!.set(key, vectorView);
			return vectorView;
		}
	}

	destroy(): void {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		this.entityManager.releaseEntityInstance(this);
		this.active = false;
		this.bitmask = new BitSet();
		this.queryManager.updateEntity(this);
	}
}

export type EntityConstructor = {
	new (
		_em: EntityManager,
		_qm: QueryManager,
		_cm: ComponentManager,
		_idx: number,
	): EntityLike;
};

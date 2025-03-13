import type {
	ComponentConstructor,
	ComponentMask,
	ComponentValue,
	ComponentSchema,
} from './Component.js';

import BitSet from 'bitset';
import type { ComponentManager } from './ComponentManager.js';
import type { EntityManager } from './EntityManager.js';
import type { QueryManager } from './QueryManager.js';
import { TypedArrayMap, Types, type TypedArray } from './Types.js';
import { assertCondition, ErrorMessages } from './Checks.js';

export interface EntityLike {
	bitmask: ComponentMask;
	active: boolean;
	readonly index: number;

	addComponent<C extends ComponentConstructor<any>>(
		componentClass: C,
		initialData?: Partial<{
			[K in keyof C['schema']]: ComponentValue<C['schema'][K]['type']>;
		}>,
	): this;

	removeComponent(componentClass: ComponentConstructor<any>): this;

	hasComponent(componentClass: ComponentConstructor<any>): boolean;

	getComponents(): ComponentConstructor<any>[];

	getValue<C extends ComponentConstructor<any>, K extends keyof C['schema']>(
		componentClass: C,
		key: K,
	): ComponentValue<C['schema'][K]['type']>;

	setValue<C extends ComponentConstructor<any>, K extends keyof C['schema']>(
		componentClass: C,
		key: K,
		value: ComponentValue<C['schema'][K]['type']>,
	): void;

	getVectorView<
		S extends ComponentSchema<Types>,
		C extends ComponentConstructor<S>,
	>(
		componentClass: C,
		key: keyof C['schema'],
	): TypedArray;

	destroy(): void;
}

export class Entity implements EntityLike {
	public bitmask: ComponentMask = new BitSet();
	public active = true;
	private vectorViews: Map<
		ComponentConstructor<ComponentSchema<Types>>,
		Map<string, TypedArray>
	> = new Map();

	constructor(
		protected entityManager: EntityManager,
		protected queryManager: QueryManager,
		protected componentManager: ComponentManager,
		public readonly index: number,
	) {}

	addComponent<C extends ComponentConstructor<any>>(
		componentClass: C,
		initialData: Partial<{
			[K in keyof C['schema']]: ComponentValue<C['schema'][K]['type']>;
		}> = {},
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
		componentClass.onAttach(this.index);
		return this;
	}

	removeComponent(componentClass: ComponentConstructor<any>): this {
		assertCondition(this.active, ErrorMessages.ModifyDestroyedEntity, this);
		assertCondition(
			componentClass.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			componentClass,
		);
		this.bitmask = this.bitmask.andNot(componentClass.bitmask!);
		this.queryManager.updateEntity(this);
		componentClass.onDetach(this.index);
		return this;
	}

	hasComponent(componentClass: ComponentConstructor<any>): boolean {
		assertCondition(
			componentClass.bitmask !== null,
			ErrorMessages.ComponentNotRegistered,
			componentClass,
		);
		return !this.bitmask.and(componentClass.bitmask!).isEmpty();
	}

	getComponents(): ComponentConstructor<any>[] {
		const bitArray = this.bitmask.toArray();
		return bitArray.map(
			(typeId) => this.componentManager.getComponentByTypeId(typeId)!,
		);
	}

	getValue<C extends ComponentConstructor<any>, K extends keyof C['schema']>(
		componentClass: C,
		key: K,
	): ComponentValue<C['schema'][K]['type']> {
		return componentClass.data[key]?.[this.index] as ComponentValue<
			C['schema'][K]['type']
		>;
	}

	setValue<C extends ComponentConstructor<any>, K extends keyof C['schema']>(
		componentClass: C,
		key: K,
		value: ComponentValue<C['schema'][K]['type']>,
	): void {
		const componentData = componentClass.data[key];
		componentData[this.index] = value;
	}

	getVectorView<
		S extends ComponentSchema<Types>,
		C extends ComponentConstructor<S>,
	>(componentClass: C, key: keyof C['schema']) {
		key = key as string;
		const cachedVectorView = this.vectorViews.get(componentClass)?.get(key);
		if (cachedVectorView) {
			return cachedVectorView;
		} else {
			const componentData = componentClass.data[key] as TypedArray;
			const type = componentClass.schema[key].type;
			const length = TypedArrayMap[type].length;
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
	): EntityLike;
};

import type { Component, ComponentMask } from './component.js';
import {
	DataArrayToType,
	DataType,
	TypeValueToType,
	TypedArray,
	TypedArrayMap,
	Types,
} from './types.js';
import {
	ErrorMessages,
	assertCondition,
	assertValidEnumValue,
	assertValidRangeValue,
} from './checks.js';

import BitSet from './bit-set.js';
import type { ComponentManager } from './component-manager.js';
import type { EntityManager } from './entity-manager.js';
import type { QueryManager } from './query-manager.js';

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

		switch (type) {
			case Types.Boolean:
				return Boolean(data) as TypeValueToType<C['schema'][K]['type']>;
			case Types.Entity:
				return this.entityManager.getEntityByIndex(data) as TypeValueToType<
					C['schema'][K]['type']
				>;
			default:
				return data as TypeValueToType<C['schema'][K]['type']>;
		}
	}

	setValue<C extends Component<any>, K extends keyof C['schema']>(
		component: C,
		key: K,
		value: TypeValueToType<C['schema'][K]['type']>,
	): void {
		const componentData = component.data[key];
		const schemaField = component.schema[key];
		const type = schemaField.type as DataType;

		switch (type) {
			case Types.Enum:
				// enum property is guaranteed to exist due to initialization validation
				assertValidEnumValue(value as number, schemaField.enum, key as string);
				componentData[this.index] = value as any;
				break;
			case Types.Int8:
			case Types.Int16:
			case Types.Float32:
			case Types.Float64:
				// For numeric types, validate range constraints if present
				if ('min' in schemaField || 'max' in schemaField) {
					assertValidRangeValue(
						value as number,
						schemaField.min,
						schemaField.max,
						key as string,
					);
				}
				componentData[this.index] = value as any;
				break;
			case Types.Entity:
				componentData[this.index] = (value as any as Entity).index;
				break;
			default:
				componentData[this.index] = value as any;
				break;
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

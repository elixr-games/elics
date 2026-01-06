import {
	AnyComponent,
	DataArrayToType,
	DataType,
	TypeValueToType,
	TypedArray,
	TypedArrayMap,
	Types,
} from './types.js';
import { assertValidEnumValue, assertValidRangeValue } from './checks.js';

import BitSet from './bit-set.js';
import type { ComponentManager } from './component-manager.js';
import type { ComponentMask } from './component.js';
import type { EntityManager } from './entity-manager.js';
import type { QueryManager } from './query-manager.js';

export type VectorKeys<C extends AnyComponent> = {
	[K in keyof C['schema']]: DataArrayToType<
		C['schema'][K]['type']
	> extends TypedArray
		? K
		: never;
}[keyof C['schema']];

export class Entity {
	public bitmask: ComponentMask = new BitSet();

	public active = true;

	public generation = 0;

	private vectorViews: Map<AnyComponent, Map<string, TypedArray>> = new Map();

	constructor(
		protected entityManager: EntityManager,
		protected queryManager: QueryManager,
		protected componentManager: ComponentManager,
		public readonly index: number,
	) {}

	addComponent<C extends AnyComponent>(
		component: C,
		initialData: Partial<{
			[K in keyof C['schema']]: TypeValueToType<C['schema'][K]['type']>;
		}> = {},
	): this {
		if (!this.active) {
			console.warn(
				`Entity ${this.index} is destroyed, cannot add component ${component.schema}`,
			);
		} else {
			if (component.bitmask === null) {
				this.componentManager.registerComponent(component);
			}
			this.bitmask.orInPlace(component.bitmask!);
			this.componentManager.attachComponentToEntity(
				this.index,
				component,
				initialData,
			);
			this.queryManager.updateEntity(this, component);
		}
		return this;
	}

	removeComponent(component: AnyComponent): this {
		if (!this.active) {
			console.warn(
				`Entity ${this.index} is destroyed, cannot remove component ${component.schema}`,
			);
		} else if (component.bitmask) {
			this.bitmask.andNotInPlace(component.bitmask!);
			this.vectorViews.delete(component);
			this.queryManager.updateEntity(this, component);
		}
		return this;
	}

	hasComponent(component: AnyComponent): boolean {
		return this.bitmask.intersects(component.bitmask!);
	}

	getComponents(): AnyComponent[] {
		const bitArray = this.bitmask.toArray();
		return bitArray.map(
			(typeId) => this.componentManager.getComponentByTypeId(typeId)!,
		);
	}

	getValue<C extends AnyComponent, K extends keyof C['schema']>(
		component: C,
		key: K,
	): TypeValueToType<C['schema'][K]['type']> | null {
		// allow runtime access with invalid keys, return null
		const schemaEntry = component.schema[key as string];
		if (!schemaEntry) {
			return null;
		}

		const dataContainer = (component.data as Record<string, unknown>)[
			key as string
		] as unknown;
		const indexed = dataContainer as { [index: number]: unknown } | undefined;
		const data = indexed ? indexed[this.index] : undefined;
		const type = schemaEntry.type as DataType;

		switch (type) {
			case Types.Vec2:
			case Types.Vec3:
			case Types.Vec4:
			case Types.Color:
				throw new Error(
					'Array/vector types must be read via getVectorView(component, key).',
				);
			case Types.Boolean:
				return Boolean(data) as TypeValueToType<C['schema'][K]['type']>;
			case Types.Entity:
				return this.entityManager.getEntityByPackedRef(
					data as number,
				) as TypeValueToType<C['schema'][K]['type']>;
			default:
				return data as TypeValueToType<C['schema'][K]['type']>;
		}
	}

	setValue<C extends AnyComponent, K extends keyof C['schema']>(
		component: C,
		key: K,
		value: TypeValueToType<C['schema'][K]['type']>,
	): void {
		const componentData = (component.data as Record<string, unknown>)[
			key as string
		] as unknown;
		const schemaField = (component.schema as Record<string, unknown>)[
			key as string
		] as unknown as { type: DataType; [k: string]: unknown };
		const type = schemaField.type as DataType;

		switch (type) {
			case Types.Vec2:
			case Types.Vec3:
			case Types.Vec4:
			case Types.Color:
				throw new Error(
					'Array/vector types must be written via getVectorView(component, key).',
				);
			case Types.Enum:
				// enum property is guaranteed to exist due to initialization validation
				assertValidEnumValue(
					value as string,
					(schemaField as unknown as { enum: { [k: string]: string } }).enum,
					key as string,
				);
				(componentData as { [idx: number]: unknown })[this.index] =
					value as string;
				break;
			case Types.Int8:
			case Types.Int16:
			case Types.Float32:
			case Types.Float64:
				// For numeric types, validate range constraints if present
				if ('min' in schemaField || 'max' in schemaField) {
					assertValidRangeValue(
						value as number,
						(schemaField as unknown as { min?: number }).min,
						(schemaField as unknown as { max?: number }).max,
						key as string,
					);
				}
				(componentData as { [idx: number]: unknown })[this.index] =
					value as number;
				break;
			case Types.Entity:
				(componentData as { [idx: number]: unknown })[this.index] =
					this.entityManager.packEntityRef(value as Entity | null);
				break;
			default:
				(componentData as { [idx: number]: unknown })[this.index] =
					value as unknown;
				break;
		}

		// Notify only queries that depend on this component's values
		this.queryManager.updateEntityValue(this, component);
	}

	getVectorView<C extends AnyComponent, K extends VectorKeys<C>>(
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
		if (this.active) {
			this.active = false;
			this.bitmask.clear();
			this.vectorViews.clear();
			this.queryManager.resetEntity(this);
			this.entityManager.releaseEntityInstance(this);
		}
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

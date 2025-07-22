import {
	DataArrayToType,
	DataType,
	TypedArray,
	TypedArrayMap,
	TypedSchema,
	Types,
} from './types.js';
import {
	ErrorMessages,
	assertCondition,
	assertValidEnumValue,
	assertValidRangeValue,
} from './checks.js';

import BitSet from './bit-set.js';

export type ComponentMask = BitSet;

export interface Component<S extends TypedSchema<DataType>> {
	schema: S;
	data: { [K in keyof S]: DataArrayToType<S[K]['type']> };
	bitmask: ComponentMask | null;
	typeId: number;
}

export function createComponent<T extends DataType, S extends TypedSchema<T>>(
	schema: S,
): Component<S> {
	return {
		schema,
		data: {} as { [K in keyof S]: DataArrayToType<S[K]['type']> },
		bitmask: null,
		typeId: -1,
	};
}

export function initializeComponentStorage<
	T extends DataType,
	S extends TypedSchema<T>,
>(component: Component<S>, entityCapacity: number): void {
	const s = component.schema;
	component.data = {} as { [K in keyof S]: DataArrayToType<S[K]['type']> };
	for (const key in s) {
		const schemaField = s[key];
		const { type, default: defaultValue } = schemaField;
		let { arrayConstructor, length } = TypedArrayMap[type];

		// For Enum types, validate enum property exists and determine array type
		if (type === Types.Enum) {
			assertCondition(
				'enum' in schemaField,
				ErrorMessages.InvalidDefaultValue,
				`Enum type requires 'enum' property for field ${key}`,
			);
			const enumValues = Object.values(schemaField.enum).filter(
				(v) => typeof v === 'number',
			) as number[];
			const maxValue = Math.max(...enumValues);
			const minValue = Math.min(...enumValues);

			if (minValue >= -128 && maxValue <= 127) {
				arrayConstructor = Int8Array;
			} else {
				arrayConstructor = Int16Array;
			}
		}

		assertCondition(!!arrayConstructor, ErrorMessages.TypeNotSupported, type);
		component.data[key] = new arrayConstructor(
			entityCapacity * length,
		) as DataArrayToType<T>;
		assertCondition(
			length === 1 ||
				(Array.isArray(defaultValue) && defaultValue.length === length),
			ErrorMessages.InvalidDefaultValue,
			key,
		);
	}
}

export function assignInitialComponentData<
	T extends DataType,
	S extends TypedSchema<T>,
>(
	component: Component<S>,
	index: number,
	initialData: { [key: string]: any },
): void {
	const s = component.schema;
	for (const key in s) {
		const schemaField = s[key];
		const { type, default: defaultValue } = schemaField;
		const length = TypedArrayMap[type].length;
		const dataRef = component.data[key];
		const input = initialData[key] ?? defaultValue;
		switch (type) {
			case Types.Entity:
				dataRef[index] = input ? input.index : -1;
				break;
			case Types.Enum:
				assertValidEnumValue(input, schemaField.enum, key);
				dataRef[index] = input;
				break;
			case Types.Int8:
			case Types.Int16:
			case Types.Float32:
			case Types.Float64:
				// For numeric types, validate range constraints if present
				if ('min' in schemaField || 'max' in schemaField) {
					assertValidRangeValue(input, schemaField.min, schemaField.max, key);
				}
				dataRef[index] = input;
				break;
			case Types.String:
			case Types.Object:
				dataRef[index] = input;
				break;
			default:
				if (length === 1) {
					dataRef[index] = input;
				} else {
					(dataRef as TypedArray).set(input, index * length);
				}
				break;
		}
	}
}

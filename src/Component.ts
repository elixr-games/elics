import { ErrorMessages, assertCondition } from './Checks.js';
import { TypedArray, TypedArrayMap, Types } from './Types.js';

import BitSet from 'bitset';

export type ComponentMask = BitSet;

export type ComponentValue<T extends Types> = T extends
	| Types.Int8
	| Types.Int16
	| Types.Float32
	| Types.Float64
	? number
	: T extends Types.Boolean
		? boolean
		: T extends Types.String
			? string
			: T extends Types.Vec2
				? [number, number]
				: T extends Types.Vec3
					? [number, number, number]
					: T extends Types.Vec4
						? [number, number, number, number]
						: any;

export type ComponentDataType<T extends Types> = T extends
	| Types.Int8
	| Types.Int16
	| Types.Float32
	| Types.Float64
	| Types.Boolean
	| Types.Vec2
	| Types.Vec3
	| Types.Vec4
	? TypedArray
	: T extends Types.String
		? Array<string>
		: T extends Types.Object
			? any[]
			: never;

export type ComponentSchema<T extends Types> = Record<
	string,
	{
		type: T;
		default: ComponentValue<T>;
	}
>;

export type ComponentConstructor<S extends ComponentSchema<Types>> = {
	schema: S;
	data: { [K in keyof S]: ComponentDataType<S[K]['type']> };
	bitmask: ComponentMask | null;
	typeId: number;
	onDetach: (index: number) => void;
	onAttach: (index: number) => void;
	initializeStorage: (entityCapacity: number) => void;
	assignInitialData: (
		index: number,
		initialData: { [K in keyof S]?: ComponentValue<S[K]['type']> },
	) => void;
};

export function createComponent<S extends ComponentSchema<Types>>(
	schema: S,
): ComponentConstructor<S> {
	// Return a new class (an anonymous class expression) that implements the ComponentConstructor.
	return class {
		// The provided schema.
		static schema: S = schema;
		// The data storage is allocated later in initializeStorage.
		static data: { [K in keyof S]: ComponentDataType<S[K]['type']> } =
			{} as any;
		// Additional static members with default values.
		static bitmask: ComponentMask | null = null;
		static typeId: number = -1;
		static onDetach: (index: number) => void = () => {};
		static onAttach: (index: number) => void = () => {};

		// Allocate storage for each key in the schema.
		static initializeStorage(entityCapacity: number): void {
			const s = this.schema;
			this.data = {} as { [K in keyof S]: ComponentDataType<S[K]['type']> };
			for (const key in s) {
				if (s.hasOwnProperty(key)) {
					const { type, default: defaultValue } = s[key];
					const { arrayConstructor, length } = TypedArrayMap[type];
					assertCondition(
						!!arrayConstructor,
						ErrorMessages.TypeNotSupported,
						type,
					);
					this.data[key] = new arrayConstructor(entityCapacity * length) as any;
					assertCondition(
						length === 1 || (defaultValue as any[]).length === length,
						ErrorMessages.InvalidDefaultValue,
						key,
					);
				}
			}
		}

		// Assign initial data to the allocated storage for an entity at a given index.
		static assignInitialData(
			index: number,
			initialData: { [key: string]: any },
		): void {
			const s = this.schema;
			for (const key in s) {
				if (s.hasOwnProperty(key)) {
					const { type, default: defaultValue } = s[key];
					const length = TypedArrayMap[type].length;
					const dataRef = this.data[key];
					const input = initialData[key] ?? defaultValue;
					if (length === 1 || type === Types.String || type === Types.Object) {
						dataRef[index] = input;
					} else {
						(dataRef as TypedArray).set(input, index * length);
					}
				}
			}
		}
	} as unknown as ComponentConstructor<S>;
}

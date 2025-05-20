import {
	DataArrayToType,
	DataType,
	TypedArray,
	TypedArrayMap,
	TypedSchema,
	Types,
} from './Types.js';
import { ErrorMessages, assertCondition } from './Checks.js';

import BitSet from './BitSet.js';

export type ComponentMask = BitSet;

export interface Component<S extends TypedSchema<DataType>> {
	schema: S;
	data: { [K in keyof S]: DataArrayToType<S[K]['type']> };
	bitmask: ComponentMask | null;
	typeId: number;
	onAttach: (data: Component<S>['data'], index: number) => void;
	onDetach: (data: Component<S>['data'], index: number) => void;
}

export function createComponent<T extends DataType, S extends TypedSchema<T>>(
	schema: S,
	onAttach: (data: Component<S>['data'], index: number) => void = () => {},
	onDetach: (data: Component<S>['data'], index: number) => void = () => {},
): Component<S> {
	return {
		schema,
		data: {} as { [K in keyof S]: DataArrayToType<S[K]['type']> },
		bitmask: null,
		typeId: -1,
		onAttach,
		onDetach,
	};
}

export function initializeComponentStorage<
	T extends DataType,
	S extends TypedSchema<T>,
>(component: Component<S>, entityCapacity: number): void {
	const s = component.schema;
	component.data = {} as { [K in keyof S]: DataArrayToType<S[K]['type']> };
	for (const key in s) {
		const { type, default: defaultValue } = s[key];
		const { arrayConstructor, length } = TypedArrayMap[type];
		assertCondition(!!arrayConstructor, ErrorMessages.TypeNotSupported, type);
		component.data[key] = new arrayConstructor(entityCapacity * length) as any;
		assertCondition(
			length === 1 || (defaultValue as any[]).length === length,
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
		const { type, default: defaultValue } = s[key];
		const length = TypedArrayMap[type].length;
		const dataRef = component.data[key];
		const input = initialData[key] ?? defaultValue;
		if (type === Types.Entity) {
			dataRef[index] = input ? input.index : -1;
		} else if (length === 1 || type === Types.String || type === Types.Object) {
			dataRef[index] = input;
		} else {
			(dataRef as TypedArray).set(input, index * length);
		}
	}
}

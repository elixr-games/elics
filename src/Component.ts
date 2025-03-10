import { ErrorMessages, assertCondition } from './Checks.js';
import { TypedArray, TypedArrayMap, Types } from './Types.js';

import BitSet from 'bitset';

export type ComponentMask = BitSet;

export class Component {
	static schema: { [key: string]: { type: Types; default: any } } = {};
	static data: { [key: string]: TypedArray | Array<any> } = {};
	static bitmask: ComponentMask | null = null;
	static typeId: number = -1;
	static onDetach: (index: number) => void = () => {};
	static onAttach: (index: number) => void = () => {};

	static initializeStorage(entityCapacity: number): void {
		const schema = this.schema;
		this.data = {};

		for (const [key, { type, default: defaultValue }] of Object.entries(
			schema,
		)) {
			const { arrayConstructor, length } = TypedArrayMap[type];
			assertCondition(arrayConstructor, ErrorMessages.TypeNotSupported, type);
			this.data[key] = new arrayConstructor(entityCapacity * length);
			assertCondition(
				length === 1 || (defaultValue as Array<any>).length === length,
				ErrorMessages.InvalidDefaultValue,
				key,
			);
		}
	}

	static assignInitialData(index: number, initialData: { [key: string]: any }) {
		for (const [key, entry] of Object.entries(this.schema)) {
			const { type, default: defaultValue } = entry;
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

export type ComponentConstructor = {
	schema: { [key: string]: { type: Types; default: any } };
	data: { [key: string]: TypedArray | Array<any> };
	bitmask: ComponentMask | null;
	typeId: number;
	onDetach: (index: number) => void;
	onAttach: (index: number) => void;
	initializeStorage: (entityCapacity: number) => void;
	assignInitialData: (
		index: number,
		initialData: { [key: string]: any },
	) => void;
};

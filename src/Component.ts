import { TypedArrayMap, Types } from './Types.js';

import BitSet from 'bitset';

export type ComponentMask = BitSet;

export const PRIVATE = Symbol('@elics/component');

type TypedArray =
	| Int8Array
	| Int16Array
	| Float32Array
	| Float64Array
	| Uint8Array;

export class Component {
	static schema: { [key: string]: { type: Types; default: any } } = {};
	static typedArrays: { [key: string]: TypedArray } = {};
	static bitmask: ComponentMask | null = null;

	static initializeStorage(entityCapacity: number): void {
		const schema = this.schema;
		this.typedArrays = {};

		for (const [key, { type, default: defaultValue }] of Object.entries(
			schema,
		)) {
			const ArrayConstructor = TypedArrayMap[type];
			if (!ArrayConstructor) {
				throw new Error(`Unsupported type: ${type}`);
			}
			this.typedArrays[key] = new ArrayConstructor(entityCapacity);
			this.typedArrays[key].fill(defaultValue); // Initialize with default values
		}
	}

	static assignInitialData(index: number, initialData: { [key: string]: any }) {
		for (const [key, { default: defaultValue }] of Object.entries(
			this.schema,
		)) {
			this.typedArrays[key][index] = initialData[key] ?? defaultValue;
		}
	}
}

export type ComponentConstructor = {
	bitmask: ComponentMask | null; // Static property
	schema: { [key: string]: { type: Types; default: any } }; // Static property
	typedArrays: { [key: string]: TypedArray }; // Static property
	initializeStorage: (entityCapacity: number) => void; // Static method
	assignInitialData: (
		index: number,
		initialData: { [key: string]: any },
	) => void; // Static method
};

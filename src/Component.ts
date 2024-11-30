import { TypedArray, TypedArrayMap, Types } from './Types.js';

import BitSet from 'bitset';

export type ComponentMask = BitSet;

export const PRIVATE = Symbol('@elics/component');

export class Component {
	static schema: { [key: string]: { type: Types; default: any } } = {};
	static data: { [key: string]: TypedArray | Array<any> } = {};
	static bitmask: ComponentMask | null = null;

	static initializeStorage(entityCapacity: number): void {
		const schema = this.schema;
		this.data = {};

		for (const [key, { type }] of Object.entries(schema)) {
			const { ArrayConstructor, length } = TypedArrayMap[type];
			if (!ArrayConstructor) {
				throw new Error(`Unsupported type: ${type}`);
			}
			this.data[key] = new ArrayConstructor(entityCapacity * length);
		}
	}

	static assignInitialData(index: number, initialData: { [key: string]: any }) {
		for (const [key, { type, default: defaultValue }] of Object.entries(
			this.schema,
		)) {
			const { length } = TypedArrayMap[type];
			if (length === 1) {
				this.data[key][index] = initialData[key] ?? defaultValue;
			} else {
				for (let i = 0; i < length; i++) {
					this.data[key][index * length + i] =
						initialData[key]?.[i] ?? defaultValue[i];
				}
			}
		}
	}
}

export type ComponentConstructor = {
	bitmask: ComponentMask | null;
	schema: { [key: string]: { type: Types; default: any } };
	data: { [key: string]: TypedArray | Array<any> };
	initializeStorage: (entityCapacity: number) => void;
	assignInitialData: (
		index: number,
		initialData: { [key: string]: any },
	) => void;
};

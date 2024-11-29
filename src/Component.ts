import { TypedArrayMap, Types } from './Types.js';

import BitSet from 'bitset';
import { ComponentManager } from './ComponentManager.js';

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
	static entityCapacity = 1000;
	static bitmask: ComponentMask | null = null;

	readonly index: number;

	public reset(): void {
		// noop
	}

	[PRIVATE]: {
		componentManager: ComponentManager;
		assignInitialData: (initialData: { [key: string]: any }) => void;
	} = {
		componentManager: undefined!,
		assignInitialData: (initialData: { [key: string]: any }) => {
			for (const [key, { default: defaultValue }] of Object.entries(
				(this.constructor as typeof Component).schema,
			)) {
				this.set(key, initialData[key] ?? defaultValue);
			}
		},
	};

	constructor(componentManager: ComponentManager, index: number) {
		this[PRIVATE].componentManager = componentManager;
		this.index = index;
	}

	static initializeStorage(): void {
		const schema = this.schema;
		this.typedArrays = {};

		for (const [key, { type, default: defaultValue }] of Object.entries(
			schema,
		)) {
			const ArrayConstructor = TypedArrayMap[type];
			if (!ArrayConstructor) {
				throw new Error(`Unsupported type: ${type}`);
			}
			this.typedArrays[key] = new ArrayConstructor(this.entityCapacity);
			this.typedArrays[key].fill(defaultValue); // Initialize with default values
		}
	}

	get<T>(key: string): T {
		return (this.constructor as typeof Component).typedArrays[key][
			this.index
		] as T;
	}

	set<T>(key: string, value: T): void {
		(this.constructor as typeof Component).typedArrays[key][this.index] =
			value as any;
	}
}

export type ComponentConstructor<T extends Component> = {
	new (
		_cm: ComponentManager,
		_mi: number,
		initialData?: { [key: string]: any },
	): T;
	bitmask: ComponentMask | null; // Static property
	schema: { [key: string]: { type: Types; default: any } }; // Static property
	typedArrays: { [key: string]: TypedArray }; // Static property
	entityCapacity: number; // Static property
	initializeStorage: () => void; // Static method
};

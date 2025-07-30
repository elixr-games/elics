export type DataType =
	| 'Int8'
	| 'Int16'
	| 'Entity'
	| 'Float32'
	| 'Float64'
	| 'Boolean'
	| 'String'
	| 'Object'
	| 'Vec2'
	| 'Vec3'
	| 'Vec4'
	| 'Enum';

export enum Types {
	Int8 = 'Int8',
	Int16 = 'Int16',
	Entity = 'Entity',
	Float32 = 'Float32',
	Float64 = 'Float64',
	Boolean = 'Boolean',
	String = 'String',
	Object = 'Object',
	Vec2 = 'Vec2',
	Vec3 = 'Vec3',
	Vec4 = 'Vec4',
	Enum = 'Enum',
}

export type TypedArray =
	| Int8Array
	| Int16Array
	| Int32Array
	| Float32Array
	| Float64Array
	| Uint8Array;

export type TypedArrayConstructor =
	| Int8ArrayConstructor
	| Int16ArrayConstructor
	| Int32ArrayConstructor
	| Float32ArrayConstructor
	| Float64ArrayConstructor
	| Uint8ArrayConstructor;

export const TypedArrayMap: {
	[key in DataType]: {
		arrayConstructor: TypedArrayConstructor | ArrayConstructor;
		length: number;
	};
} = {
	Int8: { arrayConstructor: Int8Array, length: 1 },
	Int16: { arrayConstructor: Int16Array, length: 1 },
	Entity: { arrayConstructor: Int32Array, length: 1 },
	Float32: { arrayConstructor: Float32Array, length: 1 },
	Float64: { arrayConstructor: Float64Array, length: 1 },
	Boolean: { arrayConstructor: Uint8Array, length: 1 },
	String: { arrayConstructor: Array, length: 1 },
	Object: { arrayConstructor: Array, length: 1 },
	Vec2: { arrayConstructor: Float32Array, length: 2 },
	Vec3: { arrayConstructor: Float32Array, length: 3 },
	Vec4: { arrayConstructor: Float32Array, length: 4 },
	Enum: { arrayConstructor: Int8Array, length: 1 }, // Default, will be overridden based on enum size
};

export type TypeValueToType<T extends DataType> = T extends
	| 'Int8'
	| 'Int16'
	| 'Float32'
	| 'Float64'
	| 'Enum'
	? number
	: T extends 'Boolean'
		? boolean
		: T extends 'String'
			? string
			: T extends 'Vec2'
				? [number, number]
				: T extends 'Vec3'
					? [number, number, number]
					: T extends 'Vec4'
						? [number, number, number, number]
						: T extends 'Entity'
							? import('./entity.js').Entity | null
							: T extends 'Object'
								? unknown
								: never;

export type DataArrayToType<T extends DataType> = T extends
	| 'Int8'
	| 'Int16'
	| 'Entity'
	| 'Float32'
	| 'Float64'
	| 'Boolean'
	| 'Vec2'
	| 'Vec3'
	| 'Vec4'
	| 'Enum'
	? TypedArray
	: T extends 'String'
		? Array<string>
		: T extends 'Object'
			? Array<unknown>
			: never;

export type EnumType<T extends number = number> = {
	[key: string]: T | string;
	[key: number]: string;
};

export type SchemaField<T extends DataType> = T extends 'Enum'
	? {
			type: T;
			default: TypeValueToType<T>;
			enum: EnumType;
		}
	: T extends 'Int8' | 'Int16' | 'Float32' | 'Float64'
		? {
				type: T;
				default: TypeValueToType<T>;
				min?: number;
				max?: number;
			}
		: T extends 'Entity'
			? {
					type: T;
					default: import('./entity.js').Entity | null;
				}
			: T extends 'Object'
				? {
						type: T;
						default: unknown;
					}
				: T extends 'Boolean'
					? {
							type: T;
							default: boolean;
						}
					: T extends 'String'
						? {
								type: T;
								default: string;
							}
						: T extends 'Vec2'
							? {
									type: T;
									default: [number, number];
								}
							: T extends 'Vec3'
								? {
										type: T;
										default: [number, number, number];
									}
								: T extends 'Vec4'
									? {
											type: T;
											default: [number, number, number, number];
										}
									: never;

export type TypedSchema<T extends DataType> = Record<string, SchemaField<T>>;

// Utility types for better type safety
export type AnySchema = TypedSchema<DataType>;
export type AnyComponent = import('./component.js').Component<AnySchema>;
export type AnySystem = import('./system.js').System<
	import('./system.js').SystemSchema,
	import('./system.js').SystemQueries
>;

// Type for initial component data with proper constraints
export type ComponentInitialData<C extends AnyComponent> = Partial<{
	[K in keyof C['schema']]: TypeValueToType<C['schema'][K]['type']>;
}>;

export type DataType =
	| 'Int8'
	| 'Int16'
	| 'Float32'
	| 'Float64'
	| 'Boolean'
	| 'String'
	| 'Object'
	| 'Vec2'
	| 'Vec3'
	| 'Vec4';

export enum Types {
	Int8 = 'Int8',
	Int16 = 'Int16',
	Float32 = 'Float32',
	Float64 = 'Float64',
	Boolean = 'Boolean',
	String = 'String',
	Object = 'Object',
	Vec2 = 'Vec2',
	Vec3 = 'Vec3',
	Vec4 = 'Vec4',
}

export type TypedArray =
	| Int8Array
	| Int16Array
	| Float32Array
	| Float64Array
	| Uint8Array;

export type TypedArrayConstructor =
	| Int8ArrayConstructor
	| Int16ArrayConstructor
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
	Float32: { arrayConstructor: Float32Array, length: 1 },
	Float64: { arrayConstructor: Float64Array, length: 1 },
	Boolean: { arrayConstructor: Uint8Array, length: 1 },
	String: { arrayConstructor: Array, length: 1 },
	Object: { arrayConstructor: Array, length: 1 },
	Vec2: { arrayConstructor: Float32Array, length: 2 },
	Vec3: { arrayConstructor: Float32Array, length: 3 },
	Vec4: { arrayConstructor: Float32Array, length: 4 },
};

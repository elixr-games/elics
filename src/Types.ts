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

export const TypedArrayMap: {
	[key in Types]: { arrayConstructor: any; length: number };
} = {
	[Types.Int8]: { arrayConstructor: Int8Array, length: 1 },
	[Types.Int16]: { arrayConstructor: Int16Array, length: 1 },
	[Types.Float32]: { arrayConstructor: Float32Array, length: 1 },
	[Types.Float64]: { arrayConstructor: Float64Array, length: 1 },
	[Types.Boolean]: { arrayConstructor: Uint8Array, length: 1 },
	[Types.String]: { arrayConstructor: Array, length: 1 },
	[Types.Object]: { arrayConstructor: Array, length: 1 },
	[Types.Vec2]: { arrayConstructor: Float32Array, length: 2 },
	[Types.Vec3]: { arrayConstructor: Float32Array, length: 3 },
	[Types.Vec4]: { arrayConstructor: Float32Array, length: 4 },
};

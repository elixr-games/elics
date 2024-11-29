export enum Types {
	Int8 = 'Int8',
	Int16 = 'Int16',
	Float32 = 'Float32',
	Float64 = 'Float64',
	Boolean = 'Boolean',
}

export const TypedArrayMap = {
	[Types.Int8]: Int8Array,
	[Types.Int16]: Int16Array,
	[Types.Float32]: Float32Array,
	[Types.Float64]: Float64Array,
	[Types.Boolean]: Uint8Array, // Boolean values can be stored in a Uint8Array (0 or 1)
};

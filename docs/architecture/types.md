---
outline: deep
---

# Types

The **Types** enum in EliCS provides a set of predefined data types that can be used to define component schemas and system configurations. The reason for enforcing types on component data is so that the ECS framework can optimize memory usage and data access with typed arrays where possible. This approach ensures that data is stored in a contiguous block of memory, improving cache performance and reducing memory fragmentation.

## Supported Types

| Type          | JavaScript Type | Description                  | Data Array Type |
| ------------- | --------------- | ---------------------------- | --------------- |
| Types.Int8    | number          | 8-bit integer                | Int8Array       |
| Types.Int16   | number          | 16-bit integer               | Int16Array      |
| Types.Entity  | Entity          | Reference to another entity  | Int16Array      |
| Types.Float32 | number          | 32-bit floating point number | Float32Array    |
| Types.Float64 | number          | 64-bit floating point number | Float64Array    |
| Types.Boolean | boolean         | True/false value             | Uint8Array      |
| Types.String  | string          | Text string                  | Array<string\>  |
| Types.Object  | object          | JavaScript object            | Array<any\>     |
| Types.Vec2    | number[]        | 2D vector                    | Float32Array    |
| Types.Vec3    | number[]        | 3D vector                    | Float32Array    |
| Types.Vec4    | number[]        | 4D vector or quaternion      | Float32Array    |

## TypedSchema Interface

The **TypedSchema** interface is used to define the structure of component data or system configuration data. It consists of key-value pairs where the key is the property name and the value is an object containing the property type and default value:

```ts
interface TypedSchema<T extends Types> {
	[key: string]: { type: T; default: DefaultValueForType<T> };
}
```

The `type` property specifies the data type (from the available [`Types`](#supported-types) options), while `default` is the default value for the property. The expected type of `default` is determined by the value assigned in `type` (as shown in the JavaScript Type column in the table above).

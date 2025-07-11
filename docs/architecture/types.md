---
outline: deep
---

# Types

The **Types** enum in EliCS provides a set of predefined data types that can be used to define component schemas and system configurations. The reason for enforcing types on component data is so that the ECS framework can optimize memory usage and data access with typed arrays where possible. This approach ensures that data is stored in a contiguous block of memory, improving cache performance and reducing memory fragmentation.

## Supported Types

| Type          | JavaScript Type | Description                            | Data Array Type         |
| ------------- | --------------- | -------------------------------------- | ----------------------- |
| Types.Int8    | number          | 8-bit integer                          | Int8Array               |
| Types.Int16   | number          | 16-bit integer                         | Int16Array              |
| Types.Entity  | Entity          | Reference to another entity            | Int16Array              |
| Types.Float32 | number          | 32-bit floating point number           | Float32Array            |
| Types.Float64 | number          | 64-bit floating point number           | Float64Array            |
| Types.Boolean | boolean         | True/false value                       | Uint8Array              |
| Types.String  | string          | Text string                            | Array<string\>          |
| Types.Object  | object          | JavaScript object                      | Array<any\>             |
| Types.Vec2    | number[]        | 2D vector                              | Float32Array            |
| Types.Vec3    | number[]        | 3D vector                              | Float32Array            |
| Types.Vec4    | number[]        | 4D vector or quaternion                | Float32Array            |
| Types.Enum    | number          | Enumerated value with number constants | Int8Array or Int16Array |

## Enum Type

The `Types.Enum` type allows you to define enumerated values with numeric constants, providing type safety and validation for component properties that should only accept specific predefined values.

### Key Features

- **Type Safety**: Only accepts valid enum values defined in the enum object
- **Automatic Storage Optimization**: Chooses Int8Array or Int16Array based on enum value range
- **Runtime Validation**: Validates enum values when `CHECKS_ON` is true
- **TypeScript Integration**: Full TypeScript support with proper type inference

### Schema Definition

For enum types, the schema requires an additional `enum` property that specifies the allowed values:

```ts
enum Season {
	Spring = 1,
	Summer = 2,
	Fall = 3,
	Winter = 4,
}

const SeasonComponent = createComponent({
	season: {
		type: Types.Enum,
		enum: Season,
		default: Season.Spring,
	},
});
```

### Storage Optimization

EliCS automatically selects the most efficient storage based on your enum values:

- **Int8Array**: Used when all enum values fit in the range [-128, 127]
- **Int16Array**: Used when enum values exceed the Int8 range

```ts
// Uses Int8Array (values 1-4 fit in Int8 range)
enum Direction {
	North = 1,
	East = 2,
	South = 3,
	West = 4,
}

// Uses Int16Array (value 1000 exceeds Int8 range)
enum StatusCode {
	Success = 200,
	NotFound = 404,
	Error = 1000,
}
```

### Usage Examples

```ts
// Define an enum
enum Priority {
	Low = 1,
	Medium = 2,
	High = 3,
}

// Create component with enum field
const TaskComponent = createComponent({
	priority: { type: Types.Enum, enum: Priority, default: Priority.Low },
	description: { type: Types.String, default: '' },
});

// Register component
world.registerComponent(TaskComponent);

// Create entity and set enum values
const entity = world.createEntity();
entity.addComponent(TaskComponent, { priority: Priority.High });

// Get enum value (returns number)
const priority = entity.getValue(TaskComponent, 'priority'); // Returns 3

// Set enum value
entity.setValue(TaskComponent, 'priority', Priority.Medium); // Sets to 2
```

### Validation

When `CHECKS_ON` is true, EliCS validates that:

- The enum property exists in the schema
- Values assigned are valid enum constants
- Default values are valid enum constants

```ts
// This will throw an error if Priority.Critical doesn't exist
entity.setValue(TaskComponent, 'priority', Priority.Critical);

// This will also throw an error
entity.setValue(TaskComponent, 'priority', 999);
```

## TypedSchema Interface

The **TypedSchema** interface is used to define the structure of component data or system configuration data. It consists of key-value pairs where the key is the property name and the value is an object containing the property type and default value:

```ts
interface TypedSchema<T extends Types> {
	[key: string]: { type: T; default: DefaultValueForType<T> };
}
```

The `type` property specifies the data type (from the available [`Types`](#supported-types) options), while `default` is the default value for the property. The expected type of `default` is determined by the value assigned in `type` (as shown in the JavaScript Type column in the table above).

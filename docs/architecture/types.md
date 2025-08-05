---
outline: deep
---

# Types

The **Types** enum in EliCS provides a set of predefined data types that can be used to define component schemas and system configurations. The reason for enforcing types on component data is so that the ECS framework can optimize memory usage and data access with typed arrays where possible. This approach ensures that data is stored in a contiguous block of memory, improving cache performance and reducing memory fragmentation.

## Supported Types

| Type          | JavaScript Type | Description                            | Data Array Type |
| ------------- | --------------- | -------------------------------------- | --------------- |
| Types.Int8    | number          | 8-bit integer                          | Int8Array       |
| Types.Int16   | number          | 16-bit integer                         | Int16Array      |
| Types.Entity  | Entity          | Reference to another entity            | Int16Array      |
| Types.Float32 | number          | 32-bit floating point number           | Float32Array    |
| Types.Float64 | number          | 64-bit floating point number           | Float64Array    |
| Types.Boolean | boolean         | True/false value                       | Uint8Array      |
| Types.String  | string          | Text string                            | Array<string\>  |
| Types.Object  | object          | JavaScript object                      | Array<any\>     |
| Types.Vec2    | number[]        | 2D vector                              | Float32Array    |
| Types.Vec3    | number[]        | 3D vector                              | Float32Array    |
| Types.Vec4    | number[]        | 4D vector or quaternion                | Float32Array    |
| Types.Enum    | string          | Enumerated value with string constants | Array<string\>  |

## Enum Type

The `Types.Enum` type allows you to define enumerated values with string constants using modern TypeScript const assertions, providing type safety and validation for component properties that should only accept specific predefined values.

### Key Features

- **Type Safety**: Only accepts valid enum values defined in the const object
- **String Storage**: Uses Array<string> for clean JavaScript output
- **Runtime Validation**: Validates enum values when `CHECKS_ON` is true
- **TypeScript Integration**: Full TypeScript support with proper type inference
- **Modern Pattern**: Uses const assertions instead of traditional TypeScript enums

### Schema Definition

For enum types, the schema requires an additional `enum` property that specifies the allowed values using const assertions:

```ts
const Season = {
	Spring: 'spring',
	Summer: 'summer',
	Fall: 'fall',
	Winter: 'winter',
} as const;

const SeasonComponent = createComponent('Season', {
	season: {
		type: Types.Enum,
		enum: Season,
		default: Season.Spring,
	},
});
```

### String Storage

EliCS stores all enum values as strings using `Array<string>`, which provides several benefits:

- **Clean JavaScript**: No compiled enum artifacts, just plain objects
- **Better Tree-Shaking**: Const objects are more optimization-friendly
- **Readable Values**: String values are self-documenting and easier to debug
- **Type Safety**: Full TypeScript type checking maintained

```ts
// Modern const assertion pattern
const Direction = {
	North: 'north',
	East: 'east',
	South: 'south',
	West: 'west',
} as const;

// Another example with descriptive strings
const StatusCode = {
	Success: 'success',
	NotFound: 'not_found',
	Error: 'error',
} as const;
```

### Usage Examples

```ts
// Define an enum using const assertion
const Priority = {
	Low: 'low',
	Medium: 'medium',
	High: 'high',
} as const;

// Create component with enum field
const TaskComponent = createComponent('Task', {
	priority: { type: Types.Enum, enum: Priority, default: Priority.Low },
	description: { type: Types.String, default: '' },
});

// Register component (optional - will auto-register if not done manually)
world.registerComponent(TaskComponent);

// Create entity and set enum values
const entity = world.createEntity();
entity.addComponent(TaskComponent, { priority: Priority.High });

// Get enum value (returns string)
const priority = entity.getValue(TaskComponent, 'priority'); // Returns 'high'

// Set enum value
entity.setValue(TaskComponent, 'priority', Priority.Medium); // Sets to 'medium'
```

### Validation

When `CHECKS_ON` is true, EliCS validates that:

- The enum property exists in the schema
- Values assigned are valid enum constants
- Default values are valid enum constants

```ts
// This will throw an error if Priority.Critical doesn't exist
entity.setValue(TaskComponent, 'priority', Priority.Critical);

// This will also throw an error - invalid string value
entity.setValue(TaskComponent, 'priority', 'invalid');
```

## Range Constraints

For numeric types (`Int8`, `Int16`, `Float32`, `Float64`), you can add optional `min` and `max` constraints to validate values within specific ranges.

### Key Features

- **Optional Constraints**: Add `min` and/or `max` properties to numeric field schemas
- **Runtime Validation**: Validates values during setValue operations and component initialization when checks are enabled
- **Flexible Bounds**: Support independent minimum and maximum constraints, or use either one alone
- **Type Support**: Works with all numeric types including integers and floating-point numbers

### Schema Definition

```ts
const StatsComponent = createComponent({
	health: { type: Types.Float32, default: 100, min: 0, max: 100 },
	experience: { type: Types.Int32, default: 0, min: 0 }, // No maximum
	temperature: { type: Types.Int16, default: 20, min: -273, max: 1000 },
	precision: { type: Types.Float64, default: 0.5, min: 0.0, max: 1.0 },
});
```

### Usage Examples

```ts
// Register component (optional - will auto-register if not done manually)
world.registerComponent(StatsComponent);

// Create entity with valid values
const entity = world.createEntity();
entity.addComponent(StatsComponent, {
	health: 75,
	experience: 1500,
	temperature: 25,
});

// Valid value changes
entity.setValue(StatsComponent, 'health', 50); // Within range
entity.setValue(StatsComponent, 'temperature', -100); // Within range

// These will throw errors when checks are enabled:
// entity.setValue(StatsComponent, 'health', -10); // Below minimum
// entity.setValue(StatsComponent, 'health', 150); // Above maximum
// entity.setValue(StatsComponent, 'experience', -5); // Below minimum
```

### Validation Behavior

When `CHECKS_ON` is true, EliCS validates that:

- Values are not below the specified minimum (if `min` is defined)
- Values are not above the specified maximum (if `max` is defined)
- Both default values and runtime assignments respect the constraints

```ts
// Component with temperature constraints
const WeatherComponent = createComponent({
	celsius: { type: Types.Int16, default: 20, min: -273, max: 100 },
});

world.registerComponent(WeatherComponent); // Optional
const entity = world.createEntity();
entity.addComponent(WeatherComponent);

// Valid operations
entity.setValue(WeatherComponent, 'celsius', -200); // Valid
entity.setValue(WeatherComponent, 'celsius', 50); // Valid

// Invalid operations (throw errors)
try {
	entity.setValue(WeatherComponent, 'celsius', -300); // Below absolute zero
} catch (error) {
	console.log(error.message); // "Value out of range: -300 is below minimum -273 for field celsius"
}

try {
	entity.setValue(WeatherComponent, 'celsius', 150); // Above boiling point
} catch (error) {
	console.log(error.message); // "Value out of range: 150 is above maximum 100 for field celsius"
}
```

## TypedSchema Interface

The **TypedSchema** interface is used to define the structure of component data or system configuration data. It consists of key-value pairs where the key is the property name and the value is an object containing the property type and default value:

```ts
interface TypedSchema<T extends Types> {
	[key: string]: { type: T; default: DefaultValueForType<T> };
}
```

The `type` property specifies the data type (from the available [`Types`](#supported-types) options), while `default` is the default value for the property. The expected type of `default` is determined by the value assigned in `type` (as shown in the JavaScript Type column in the table above).

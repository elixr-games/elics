---
outline: deep
---

# Component Class

The `Component` class in EliCS is a core element of the ECS (Entity-Component-System) architecture. Components define the data structure for specific aspects of entities and are stored in highly optimized structures to maximize performance.

## Features

- **Typed Data Storage**: Component data is stored in `TypedArray` or similar optimized structures for memory efficiency and performance.
- **Schema Definition**: Developers define a schema for each component type, enforcing data structure and types.
- **Lifecycle Hooks**: Support for `onAttach` and `onDetach` hooks enables custom logic when components are added to or removed from entities.

## Supported Types

EliCS supports various data types for component properties. These types determine how data is stored and accessed, prioritizing `TypedArray` for numerical and vector data for performance-critical applications.

### Type Mapping

| **Type**        | **Storage**    | **Description**                                                  |
| --------------- | -------------- | ---------------------------------------------------------------- |
| `Types.Int8`    | `Int8Array`    | Signed 8-bit integers.                                           |
| `Types.Int16`   | `Int16Array`   | Signed 16-bit integers.                                          |
| `Types.Float32` | `Float32Array` | Single-precision 32-bit floating-point numbers.                  |
| `Types.Float64` | `Float64Array` | Double-precision 64-bit floating-point numbers.                  |
| `Types.Boolean` | `Uint8Array`   | Booleans stored as 8-bit integers (`0` for false, `1` for true). |
| `Types.Vec2`    | `Float32Array` | Two-component vector stored as two consecutive floats.           |
| `Types.Vec3`    | `Float32Array` | Three-component vector stored as three consecutive floats.       |
| `Types.Vec4`    | `Float32Array` | Four-component vector stored as four consecutive floats.         |
| `Types.String`  | `Array`        | JavaScript strings.                                              |
| `Types.Object`  | `Array`        | Arbitrary JavaScript objects.                                    |

### Example: `EnemyComponent`

Here’s an example component, `EnemyComponent`, that uses multiple supported types to define an enemy's attributes:

```ts
import { Component, Types } from 'elics';

class EnemyComponent extends Component {
	static schema = {
		isAlive: { type: Types.Boolean, default: true },
		position: { type: Types.Vec3, default: [0, 0, 0] },
		health: { type: Types.Float32, default: 100 },
		uuid: { type: Types.String, default: '' },
		object3D: { type: Types.Object, default: null },
	};

	static onAttach(index: number): void {
		console.log(`EnemyComponent attached to entity at index ${index}`);
	}

	static onDetach(index: number): void {
		console.log(`EnemyComponent detached from entity at index ${index}`);
	}
}
```

This example demonstrates the flexibility of EliCS to handle a variety of data types while ensuring efficient storage and access.

## Component Data Storage

In EliCS, component data is centralized and managed based on the schema. This ensures consistent structure, efficient memory allocation, and fast access.

### Data Initialization

When `EnemyComponent` is registered with the `World`, its schema allocates storage arrays:

- `isAlive`: Stored in a `Uint8Array` (`1` for `true`, `0` for `false`).
- `position`: Stored as a `Float32Array` with three consecutive values for each entity.
- `health`: Stored in a `Float32Array` as a single floating-point number.
- `uuid`: Stored in a regular array for flexibility.
- `object3D`: Stored in a regular array to hold arbitrary JavaScript objects.

### Accessing Data

Component data is stored in arrays based on the schema, and is accessed by entity index:

```ts
const index = entity.index;

// Accessing values
const isAlive = EnemyComponent.data['isAlive'][index];
const position = EnemyComponent.data['position'].subarray(
	index * 3,
	index * 3 + 3,
);
const health = EnemyComponent.data['health'][index];
const uuid = EnemyComponent.data['uuid'][index];
const object3D = EnemyComponent.data['object3D'][index];

// Modifying values
EnemyComponent.data['health'][index] = 75;
EnemyComponent.data['position'].set([5, 10, 15], index * 3);
EnemyComponent.data['isAlive'][index] = 0; // Mark entity as not alive
```

Accessing data directly from the component's storage arrays ensures optimal performance and memory efficiency. However, you can also use the shorthand methods (`getValue`, `setValue`, `getVectorView`) provided by the `Entity` class for convenience.

## Lifecycle Hooks

### `onAttach`

Called when the component is added to an entity. Use this for initialization or triggering related logic.

```ts
static onAttach(index: number): void {
	console.log(`EnemyComponent attached to entity at index ${index}`);
}
```

### `onDetach`

Called when the component is removed from an entity. Use this for cleanup or related logic.

```ts
static onDetach(index: number): void {
	console.log(`EnemyComponent detached from entity at index ${index}`);
}
```

## Usage

### Attaching Components

Attach `EnemyComponent` to an entity using the `addComponent` method. Initial data can override defaults:

```ts
entity.addComponent(EnemyComponent, {
	isAlive: 1,
	position: [10, 20, 30],
	health: 50,
	uuid: 'abc123',
	object3D: someObject3D,
});
```

### Detaching Components

Remove `EnemyComponent` using the `removeComponent` method:

```ts
entity.removeComponent(EnemyComponent);
```

---
outline: deep
---

# Component

The **Component** in EliCS is a core element of the ECS (Entity-Component-System) architecture. It defines the data structure for specific aspects of entities and is designed for optimal performance by centralizing data storage in highly optimized structures. Components are not instantiated as individual objects attached to entities; instead, their data is stored in contiguous arrays (such as `TypedArray`s) to maximize memory efficiency and processing speed.

## Features

- **Typed Data Storage**: Stores component data in `TypedArray` or similar optimized structures for efficient memory usage.
- **Schema Definition**: Developers define a schema for each component type to enforce data structure, types, and default values.
- **Separation of Data and Logic**: Component data is maintained in centralized storage rather than as individual objects, reducing overhead and improving cache performance.
- **Flexible Data Types**: Supports various data types (numerical, vectors, strings, and objects) to suit different application needs.

## Implementation Overview

Under the hood, the **Component** class is optimized for performance by storing all data in centralized arrays. Instead of each entity having its own component instance, the component class maintains a set of arrays (e.g., a `Float32Array` for numerical data) where each index corresponds to an entity's component data. This design:

- **Reduces Memory Overhead**: By avoiding the creation of numerous small objects.
- **Improves Cache Locality**: Contiguous memory storage allows faster iteration and vectorized operations.
- **Enables Batch Operations**: Bulk data operations can be performed directly on the arrays, offering significant performance improvements in data-intensive applications.
- **Centralized Management**: Makes it easier to enforce consistent data structures and perform optimizations during runtime.

## Usage

The following examples demonstrate how to define a component, attach it to an entity, and access or modify its data.

### Defining a Component

Define a component with the `createComponent` function by providing a schema that defines the data structure and default values.

```ts
import { createComponent, Types } from 'elics';

// Define enums for type safety
enum EnemyType {
	Grunt = 1,
	Elite = 2,
	Boss = 3,
}

enum AIState {
	Idle = 10,
	Patrol = 20,
	Chase = 30,
	Attack = 40,
}

const schema = {
	isAlive: { type: Types.Boolean, default: true },
	position: { type: Types.Vec3, default: [0, 0, 0] },
	health: { type: Types.Float32, default: 100, min: 0, max: 100 },
	shield: { type: Types.Float32, default: 0, min: 0 },
	damage: { type: Types.Int16, default: 10, min: 1, max: 999 },
	temperature: { type: Types.Int8, default: 20, min: -50, max: 50 },
	uuid: { type: Types.String, default: '' },
	object3D: { type: Types.Object, default: null },
	enemyType: { type: Types.Enum, enum: EnemyType, default: EnemyType.Grunt },
	aiState: { type: Types.Enum, enum: AIState, default: AIState.Idle },
};

const EnemyComponent = createComponent(schema);
```

#### Component Schema

The schema defines the data structure and default values for the component as a [TypedSchema](./types.md#typedschema-interface). Each key in the schema corresponds to a property, for example:

```ts
const schema = {
	isAlive: { type: Types.Boolean, default: true },
	// ... more properties
};
```

This example schema tells EliCS that the `EnemyComponent` has a property `isAlive` of type `Boolean` with a default value of `true`.

#### Tracking Component Lifecycle

If you need to track when components are added to or removed from entities, you can use Query subscriptions. This provides a more flexible and decoupled approach than component-specific callbacks:

```ts
const enemyQuery = world.queryManager.registerQuery({
	required: [EnemyComponent],
});

// Track when entities gain the EnemyComponent
enemyQuery.subscribe('qualify', (entity) => {
	console.log(`EnemyComponent attached to entity ${entity.index}`);
});

// Track when entities lose the EnemyComponent
enemyQuery.subscribe('disqualify', (entity) => {
	const object3D = entity.getValue(EnemyComponent, 'object3D');
	if (object3D) {
		object3D.removeFromParent();
	}
});
```

This approach allows you to:

- Track multiple components with a single query
- Have multiple listeners for the same component lifecycle events
- Keep component definitions pure and focused on data
- Easily enable/disable lifecycle tracking without modifying component code

### Registering a Component

Components can be registered manually with the `World` instance for explicit control, or they will be automatically registered when first used with entities or queries.

```ts
// Manual registration (optional)
world.registerComponent(EnemyComponent);
```

The registration process initializes the component's data storage based on the defined schema. **Automatic registration** occurs when:

- A component is added to an entity via `addComponent()`
- A component is used in a query registration

::: tip Automatic vs Manual Registration
While components are automatically registered when needed, manual registration can be beneficial for:

- **Performance**: Avoiding registration overhead during gameplay
- **Explicit control**: Ensuring all components are initialized upfront
- **Error detection**: Catching schema validation issues early in development
  :::

### Attaching Components to an Entity

Attach the component to an entity using the `addComponent` method. You can optionally provide initial data to override default values.

```ts
entity.addComponent(EnemyComponent, {
	isAlive: 1,
	position: [10, 20, 30],
	health: 75, // Valid: within 0-100 range
	shield: 25, // Valid: above minimum 0
	damage: 50, // Valid: within 1-999 range
	temperature: 35, // Valid: within -50 to 50 range
	uuid: 'abc123',
	object3D: someObject3D,
	enemyType: EnemyType.Elite,
	aiState: AIState.Patrol,
});
```

### Accessing and Modifying Component Data

Directly access the underlying storage arrays for performance-critical operations. The entity’s index is used to retrieve or update data.

```ts
const index = entity.index;

// Accessing values
const isAlive = EnemyComponent.data['isAlive'][index];
const position = EnemyComponent.data['position'].subarray(
	index * 3,
	index * 3 + 3,
);
const health = EnemyComponent.data['health'][index];
const enemyType = EnemyComponent.data['enemyType'][index]; // Returns number (e.g., 2 for Elite)
const aiState = EnemyComponent.data['aiState'][index]; // Returns number (e.g., 20 for Patrol)

// Modifying values
EnemyComponent.data['health'][index] = 75;
EnemyComponent.data['position'].set([5, 10, 15], index * 3);
EnemyComponent.data['isAlive'][index] = 0; // Mark as not alive
EnemyComponent.data['enemyType'][index] = EnemyType.Boss; // Change to boss type
EnemyComponent.data['aiState'][index] = AIState.Attack; // Change AI state

// For better type safety, use entity methods instead of direct access
entity.setValue(EnemyComponent, 'enemyType', EnemyType.Boss);
entity.setValue(EnemyComponent, 'aiState', AIState.Chase);

// Range-validated operations
entity.setValue(EnemyComponent, 'health', 85); // Valid: within 0-100
entity.setValue(EnemyComponent, 'damage', 200); // Valid: within 1-999
entity.setValue(EnemyComponent, 'temperature', 0); // Valid: within -50 to 50

// These would throw errors when checks are enabled:
// entity.setValue(EnemyComponent, 'health', -5);     // Below minimum
// entity.setValue(EnemyComponent, 'health', 150);    // Above maximum
// entity.setValue(EnemyComponent, 'damage', 0);      // Below minimum
// entity.setValue(EnemyComponent, 'temperature', 60); // Above maximum

// Getting values with type safety
const currentType = entity.getValue(EnemyComponent, 'enemyType'); // Returns number
const currentState = entity.getValue(EnemyComponent, 'aiState'); // Returns number
const currentHealth = entity.getValue(EnemyComponent, 'health'); // Returns number (0-100)
```

## API Documentation

This section provides detailed information about the **Component** API in EliCS.

::: info
Components are not instantiated per entity. Instead, the component object's properties manage a centralized data store that is shared across all entities. Components are registered with the `World`, which initializes their storage based on the defined schema.
:::

### createComponent Function

Creates a new component with the specified schema.

```ts
function createComponent<T extends Types>(schema: TypedSchema<T>): Component<T>;
```

- **Parameters:**
  - `schema`: The schema defining the data structure and default values for the component.
- **Returns:** A new `Component` instance based on the provided schema.

### Component.schema

Defines the structure and default values for the component's data:

```ts
readonly schema: TypedSchema<Types>;
```

### Component.data

Defines the component's data in optimized arrays:

```ts
readonly data: { [key: keyof schema]: TypedArray | Array<any> };
```

the `data` property stores the component's data in optimized arrays (one for each property in the schema). Numerical and vector data are typically stored in a `TypedArray`, while strings and objects are stored in regular JavaScript arrays.

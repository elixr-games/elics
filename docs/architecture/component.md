---
outline: deep
---

# Component Class

The **Component** class in EliCS is a core element of the ECS (Entity-Component-System) architecture. It defines the data structure for specific aspects of entities and is designed for optimal performance by centralizing data storage in highly optimized structures. Components are not instantiated as individual objects attached to entities; instead, their data is stored in contiguous arrays (such as `TypedArray`s) to maximize memory efficiency and processing speed.

## Features

- **Typed Data Storage**: Stores component data in `TypedArray` or similar optimized structures for efficient memory usage.
- **Schema Definition**: Developers define a schema for each component type to enforce data structure, types, and default values.
- **Lifecycle Hooks**: Provides `onAttach` and `onDetach` hooks for executing custom logic when components are added to or removed from entities.
- **Separation of Data and Logic**: Component data is maintained in centralized storage rather than as individual objects, reducing overhead and improving cache performance.
- **Flexible Data Types**: Supports various data types (numerical, vectors, strings, and objects) to suit different application needs.

## Implementation Overview

Under the hood, the **Component** class is optimized for performance by storing all data in centralized arrays. Instead of each entity having its own component instance, the component class maintains a set of arrays (e.g., a `Float32Array` for numerical data) where each index corresponds to an entity's component data. This design:

- **Reduces Memory Overhead**: By avoiding the creation of numerous small objects.
- **Improves Cache Locality**: Contiguous memory storage allows faster iteration and vectorized operations.
- **Enables Batch Operations**: Bulk data operations can be performed directly on the arrays, offering significant performance improvements in data-intensive applications.
- **Centralized Management**: Makes it easier to enforce consistent data structures and perform optimizations during runtime.

## Usage

The following examples demonstrate how to define a component, attach it to an entity, and access or modify its data. Notice that component data is accessed via arrays, ensuring minimal overhead and maximum performance.

### Defining a Component

Define a component by extending the `Component` class and providing a schema that specifies the data type and default values for each property.

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

### Attaching Components to an Entity

Attach the component to an entity using the `addComponent` method. You can optionally provide initial data to override default values.

```ts
entity.addComponent(EnemyComponent, {
	isAlive: 1,
	position: [10, 20, 30],
	health: 50,
	uuid: 'abc123',
	object3D: someObject3D,
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

// Modifying values
EnemyComponent.data['health'][index] = 75;
EnemyComponent.data['position'].set([5, 10, 15], index * 3);
EnemyComponent.data['isAlive'][index] = 0; // Mark as not alive
```

## API Documentation

This section details the API of the **Component** class, including its properties and methods.

### Constructor

**Note:**  
Components are not instantiated per entity. Instead, the component class’s static methods and properties manage a centralized data store that is shared across all entities. Components are registered with the `World`, which initializes their storage based on the defined schema.

### Properties

- `schema` (`{ [key: string]: { type: Types; default: any } }`):  
  Defines the structure and default values for the component’s data. This schema is used during registration to allocate storage.

- `data` (`{ [key: string]: TypedArray | Array<any> }`):  
  Stores the component's data in optimized arrays. Numerical and vector data are typically stored in a `TypedArray`, while strings and objects are stored in regular JavaScript arrays.

- `bitmask` (`ComponentMask | null`):  
  A unique bitmask assigned to the component upon registration. It is used for fast entity filtering in queries.

- `typeId` (`number`):  
  A unique identifier for the component type, assigned during registration.

- `onAttach` (`(index: number) => void`):  
  A lifecycle hook invoked when the component is attached to an entity.

- `onDetach` (`(index: number) => void`):  
  A lifecycle hook invoked when the component is detached from an entity.

### Methods

- `initializeStorage(entityCapacity: number): void`  
  Initializes storage arrays for the component based on its schema.

  - **Parameters:**
    - `entityCapacity`: A `number` representing the maximum number of entities.
  - **Returns:** `void`.

- `assignInitialData(index: number, initialData: { [key: string]: any }): void`  
  Assigns initial data to the component's storage for a specific entity index.
  - **Parameters:**
    - `index`: A `number` indicating the entity index.
    - `initialData`: An object containing key-value pairs to initialize the component’s data.
  - **Returns:** `void`.

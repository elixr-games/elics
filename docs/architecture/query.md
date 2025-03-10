---
outline: deep
---

# Query Class

The **Query** class in EliCS is a fundamental tool in the ECS architecture, enabling efficient selection of entities based on their component composition. By leveraging component bitmasks, the Query class can rapidly determine whether an entity meets specific criteria, ensuring high performance even in large-scale, dynamic environments.

## Features

- **Efficient Querying**: Uses bitmask operations for fast, constant-time evaluations.
- **Dynamic Updates**: Automatically reflects changes as entities add or remove components.
- **Flexible Configuration**: Supports filtering based on both required and excluded components.
- **Optimized for Scale**: Minimizes overhead with bitwise operations, ideal for applications with many entities and frequent component updates.

## Implementation Overview

When a component class is registered with the **World**, it is assigned a unique bitmask. This bitmask is generated based on a unique type identifier provided by the ComponentManager. Each component's bitmask represents a distinct position in a larger bitset.

A **Query** is defined by two masks:

- **`requiredMask`**: Created by performing a bitwise OR on the bitmasks of all components listed as required. This mask represents all the components an entity must have to match the query.
- **`excludedMask`**: Created similarly from the excluded components. An entity must have none of these bits set in its bitmask to be considered a match.

Each entity also maintains its own bitmask, which is updated whenever components are added or removed. When evaluating a query, the system uses bitwise operations to compare an entity’s bitmask against the query’s masks:

- A bitwise AND between the entity’s bitmask and the **`requiredMask`** must equal the **`requiredMask`**.
- A bitwise AND between the entity’s bitmask and the **`excludedMask`** must be empty.

These bitwise operations are executed in constant time, making query evaluations extremely efficient, even as the number of entities grows.

## Usage

Below is an example that demonstrates how a system can utilize a query to process entities. In this example, `GenericSystem` defines a query to select entities that have `ComponentA` while excluding those with `ComponentC`. When systems are registered with the **World**, their queries are automatically registered, so there is no need for manual query registration.

### Example System

```ts
import { System, Entity } from 'elics';
import { ComponentA, ComponentC, ComponentB } from 'your-components';

class GenericSystem extends System {
	// Define a query for entities with ComponentA but excluding ComponentC.
	static queries = {
		entities: { required: [ComponentA], excluded: [ComponentC] },
	};

	update(): void {
		// Retrieve entities matching the query.
		const entities = this.getEntities(GenericSystem.queries.entities);
		entities.forEach((entity: Entity) => {
			const value = entity.getValue(ComponentA, 'key');
			// Example operation: create a new entity and attach ComponentB with data.
			const newEntity = this.world.createEntity();
			newEntity.addComponent(ComponentB, { key: value });
		});
	}
}
```

## API Documentation

This section provides detailed information about the **Query** class API, including its constructor, properties, and methods.

### Constructor

**Signature:**

```
new Query(requiredMask: ComponentMask, excludedMask: ComponentMask, queryId: string)
```

- **Parameters:**
  - `requiredMask`: A `ComponentMask` representing the required components.
  - `excludedMask`: A `ComponentMask` representing the excluded components.
  - `queryId`: A unique identifier for the query.
- **Description:**  
  Constructs a new instance of the **Query** class using the provided masks and identifier.

### Properties

- `requiredMask` (`ComponentMask`):  
  A bitmask representing the required components for the query. (Read-only)

- `excludedMask` (`ComponentMask`):  
  A bitmask representing the excluded components for the query. (Read-only)

- `queryId` (`string`):  
  A unique string identifier generated for the query based on its configuration. (Read-only)

### Methods

- `matches(entity: EntityLike): boolean`  
  Determines whether an entity matches the query's criteria.

  - **Parameters:**
    - `entity`: An instance of `EntityLike` to evaluate.
  - **Returns:**
    - `true` if the entity's bitmask contains all required bits and none of the excluded bits; otherwise, `false`.

- `static generateQueryInfo(queryConfig: QueryConfig): {
  requiredMask: ComponentMask;
  excludedMask: ComponentMask;
  queryId: string;
}`  
   Generates the required and excluded bitmasks along with a unique identifier for a given query configuration.
  - **Parameters:**
    - `queryConfig`: An object with `required` and optional `excluded` arrays of component classes.
  - **Returns:**
    - An object containing:
      - `requiredMask`: The combined bitmask for required components.
      - `excludedMask`: The combined bitmask for excluded components.
      - `queryId`: A unique identifier for the query.

This design leverages bitmasking to ensure that queries are processed with minimal computational overhead, making the ECS system in EliCS highly efficient and scalable.

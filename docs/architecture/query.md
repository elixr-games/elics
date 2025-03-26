---
outline: deep
---

# Query

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

```ts
import { createSystem, Entity } from 'elics';
import { ComponentA, ComponentC, ComponentB } from 'your-components';

// Define a query for entities with ComponentA but excluding ComponentC.
const queryConfig = {
	AButNotC: { required: [ComponentA], excluded: [ComponentC] },
};

class GenericSystem extends createSystem(queryConfig) {
	init(): void {
		// Subscribe to the query to receive notifications when entities qualify.
		const qualifyCallback = (entity: Entity) => {
			console.log(`Entity ${entity.id} qualifies for query AButNotC.`);
		};
		const unsub = this.queries.AButNotC.subscribe('qualify', qualifyCallback);
		// Unsubscribe later if needed.
		unsub();
	}

	update(): void {
		// Retrieve entities matching the query.
		const entities = this.queries.AButNotC.entities;
		entities.forEach((entity: Entity) => {
			const value = entity.getValue(ComponentA, 'key');
		});
	}
}
```

### Query Creation

To create a query, you need to define a query configuration object as `Record<string, { required: Component[]; excluded?: Component[] }>` that specifies the required and excluded components:

```ts
const queryConfig = {
	AButNotC: { required: [ComponentA], excluded: [ComponentC] },
	// more queries...
};
```

After creating the configuration object, it is passed to the `createSystem` function, and when the system is registered with the **World**, the `query` instances are automatically created and attached to the system. In the example above, the query `AButNotC` is accessible as `this.queries.AButNotC` within the system.

::: info
If multiple systems define the same query configuration (same `required` and `excluded` components), they will be assigned the same query instance, after the systems are registered with the **World**.
:::

### Query Subscription

You can subscribe to a query to receive notifications when entities `qualify` or `disqualify` based on the query criteria. The `subscribe` method returns an unsubscribe function that can be called to stop listening:

```ts
const qualifyCallback = (entity: Entity) => {
	console.log(`Entity ${entity.id} qualifies for query AButNotC.`);
};
const unsub = this.queries.AButNotC.subscribe('qualify', qualifyCallback);
// Unsubscribe later if needed.
unsub();
```

The callback function receives the qualifying or disqualifying entity as an argument, allowing you to perform custom logic based on the entity's state.

### Entity Polling

If you need to access entities that match the query, you can iterate over the `query.entities` set. This set contains the entities that currently match the query and is updated automatically by the `QueryManager` as entities are added or removed:

```ts
update(): void {
  const entities = this.queries.AButNotC.entities;
  entities.forEach((entity: Entity) => {
    // do something with the entity
  });
}
```

::: warning
Because polling usually happens during the update loop, EliCS exposes the `query.entities` set (source of truth for entities that match the query) directly, instead of creating a copy for performance reasons. As such, you should treat this set as read-only and avoid directly modifying it.
:::

## API Documentation

This section provides detailed information about the **Query** API in EliCS.

### Query Configuration

Define a set of queries using the following structure:

```ts
Record<string, { required: Component[]; excluded?: Component[] }>;
```

### Query.entities

A read-only set of entities that currently match the query criteria.

```ts
readonly entities: Set<Entity>;
```

### Query.subscribe

Subscribe to notifications when entities qualify or disqualify based on the query criteria.

```ts
subscribe(event: 'qualify' | 'disqualify', callback: (entity: Entity) => void): () => void;
```

- **Parameters:**
  - `event`: Event type to subscribe to (`'qualify'` or `'disqualify'`)
  - `callback`: Function to call when the event occurs
- **Returns:**
  - An unsubscribe function that removes the subscription

### Query.matches

Check if an entity matches the query criteria.

```ts
matches(entity: Entity): boolean;
```

- **Parameters:**
  - `entity`: The entity to check
- **Returns:**
  - `true` if the entity matches the query; otherwise, `false`

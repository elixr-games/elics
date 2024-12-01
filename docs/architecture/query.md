---
outline: deep
---

# Query Class

The `Query` class in EliCS is a fundamental tool in the Entity-Component-System (ECS) architecture, enabling efficient querying of entities based on their component composition. Utilizing component bitmasks, `Query` allows for rapid evaluation of entities against defined criteria, significantly optimizing performance in dynamic entity management scenarios.

## Features

- **Efficient Querying**: Uses component bitmasks for rapid query evaluation.
- **Dynamic Updates**: Automatically updates query results as entities gain or lose components.
- **Flexible Configuration**: Supports required and excluded components for precise control over entity selection.

## Querying Mechanism

The querying mechanism in EliCS leverages bitmasking, a high-performance technique for determining entity-component relationships. Each component is associated with a unique bitmask, and entities maintain a composite bitmask representing their current components.

### Advantages of Bitmasking

- **Fast Evaluation**: Bitwise operations allow rapid determination of whether an entity matches the query.
- **Dynamic Adaptation**: Entity bitmask changes automatically propagate to the query results.
- **Optimized for Scale**: Handles large numbers of entities and frequent component changes with minimal overhead.

### Query Registration and Entity Management

In EliCS, queries start tracking entities only after being registered with the `QueryManager`. This ensures that queries reflect the current state of the `World` when registered.

#### Query Lifecycle in Systems

When systems define queries via `System.queries`, those queries are registered automatically during system initialization. If entities that match the query exist before registration, those entities are not automatically included unless the query is preemptively registered.

::: tip
To avoid issues, register all components and systems before creating entities whenever possible.
:::

#### Query Uniqueness

Queries with identical configurations (same required and excluded components) are treated as equivalent. EliCS ensures consistent behavior regardless of query instance, simplifying query management.

## Usage

### Creating and Using a Query in a System

The `Query` class enables systems to efficiently interact with entities matching specific criteria. Below is an example illustrating the process:

#### Example System

This example processes entities with `ComponentA` but excludes those with `ComponentC`.

```ts
import { System, Query, Entity } from 'elics';
import { ComponentA, ComponentB, ComponentC } from 'your-components';

class GenericSystem extends System {
	// Define a query for entities with ComponentA but excluding ComponentC
	static queries = {
		entities: { required: [ComponentA], excluded: [ComponentC] },
	};

	update() {
		// Retrieve entities that match the query
		const entities = this.getEntities(GenericSystem.queries.entities);

		entities.forEach((entity: Entity) => {
			const componentA = entity.getValue(ComponentA, 'key');

			// Example operation: creating a new entity and adding ComponentB
			const newEntity = this.world.createEntity();
			newEntity.addComponent(ComponentB, { key: componentA });
		});
	}
}
```

In this example:

- `GenericSystem` uses a query to find entities with `ComponentA` but without `ComponentC`.
- The `update` method processes matching entities, demonstrating how queries streamline entity management in systems.

### Manual Query Registration

If you need to register a query outside a system:

```ts
import { QueryManager, QueryConfig } from 'elics';

const queryManager = new QueryManager();
const myQueryConfig: QueryConfig = {
	required: [ComponentA],
	excluded: [ComponentC],
};

const myQuery = queryManager.registerQuery(myQueryConfig);
```

This approach is useful for scenarios where queries are needed independently of systems.

## Constructor

Constructs a new query instance with specified required and excluded components.

```ts
constructor({ required, excluded }: QueryConfig)
```

- **required**: `ComponentConstructor[]` - An array of component classes that entities must have to match the query.
- **excluded**: `ComponentConstructor[]` (optional) - An array of component classes that entities must not have to match the query.

## Properties

### `requiredMask`

A bitmask representing the required components for the query.

- **Type**: `ComponentMask`
- **Readonly**

### `excludedMask`

A bitmask representing the excluded components for the query.

- **Type**: `ComponentMask`
- **Readonly**

### `queryId`

A unique identifier generated for the query, used internally to manage results.

- **Type**: `string`
- \*\*Readonly

## Methods

### `matches`

Determines whether an entity matches the query's criteria.

```ts
matches(entity: EntityLike): boolean
```

- **entity**: `EntityLike` - The entity to evaluate.
- **Returns**: `boolean` - `true` if the entity matches the query, otherwise `false`.

This method checks if an entity satisfies the required components and does not contain any excluded components by comparing the entity's `bitmask` against the query's `requiredMask` and `excludedMask`.

### `generateQueryInfo`

A static method to create query masks and a unique identifier for a query configuration.

```ts
static generateQueryInfo(queryConfig: QueryConfig): {
    requiredMask: ComponentMask;
    excludedMask: ComponentMask;
    queryId: string;
}
```

- **queryConfig**: `QueryConfig` - Configuration object with `required` and optional `excluded` components.
- **Returns**: An object containing:
  - `requiredMask`: A `ComponentMask` representing the required components.
  - `excludedMask`: A `ComponentMask` representing the excluded components.
  - `queryId`: A unique string identifier for the query.

This method is used internally to prepare and register queries efficiently.

## Static Methods

### `generateQueryId`

Generates a unique identifier string for a query based on its required and excluded masks.

```ts
static generateQueryId(
    requiredMask: ComponentMask,
    excludedMask: ComponentMask
): string
```

- **requiredMask**: `ComponentMask` - Bitmask representing the required components.
- **excludedMask**: `ComponentMask` (optional) - Bitmask representing the excluded components.
- **Returns**: `string` - A unique identifier for the query.

This method ensures that queries with identical configurations share the same identifier.

## Integration with `QueryManager`

The `QueryManager` class handles the lifecycle of queries, including registration, updates, and deferred processing. It ensures that all queries remain consistent with the current state of the `World`.

### Registering a Query

Queries can be registered through the `QueryManager`:

```ts
const queryConfig = {
	required: [ComponentA, ComponentB],
	excluded: [ComponentC],
};

const myQuery = queryManager.registerQuery(queryConfig);
```

### Updating Queries

When entities gain or lose components, their bitmask changes, and the `QueryManager` ensures query results are updated dynamically. Deferred updates can be triggered manually:

```ts
queryManager.deferredUpdate();
```

### Accessing Query Results

Entities matching a query can be retrieved via `QueryManager`:

```ts
const matchingEntities = queryManager.getEntities(myQuery);
```

This method returns an array of entities that satisfy the query.

## Best Practices

1. **Pre-Register Queries**: Register queries before creating entities to ensure they track all relevant entities from the start.
2. **Use Deferred Updates**: For bulk operations, enable deferred entity updates to minimize performance overhead.
3. **Avoid Redundant Queries**: Reuse existing queries with the same configuration to reduce memory and computation costs.

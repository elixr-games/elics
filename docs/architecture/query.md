---
outline: deep
---

# Query Class

The `Query` class in EliCS is a fundamental tool in the Entity-Component-System (ECS) architecture, enabling efficient querying of entities based on their component composition. Utilizing component bitmasks, `Query` allows for rapid evaluation of entities against defined criteria, significantly optimizing performance in dynamic entity management scenarios.

## Features

- **Efficient Querying**: Utilizes component bitmasks for rapid query evaluation.
- **Dynamic Entity Management**: Automatically updates query results as entities gain or lose components.

## Querying Mechanism

The querying mechanism in EliCS leverages bitmasking, a technique that significantly enhances performance, especially in complex or large-scale systems. Each component in EliCS is associated with a unique bitmask, and every entity maintains a composite bitmask representing the sum of its components.

### Advantages of Bitmasking

- **Efficient Evaluation**: By using bitwise operations on these masks, the system can quickly determine if an entity matches a query without needing to iterate over each component.
- **Rapid Updates**: As entities gain or lose components, their composite bitmask changes, allowing for instant re-evaluation against existing queries.
- **Optimized Performance**: This approach minimizes computational overhead, especially in scenarios with a large number of entities and frequent component changes.

Through this efficient querying mechanism, EliCS provides a robust and performant way to manage and interact with entities based on their component makeup, making it ideal for applications requiring dynamic and flexible entity management.

### Query Registration and Entity Creation

In EliCS, the `QueryManager` starts tracking entities for a particular query configuration only after the query has been registered with it. This behavior is crucial to understand, especially when working with systems and their associated queries.

#### System Registration and Query Collection

When utilizing `System.queries` for auto-registering queries as systems are registered, it is important to avoid creating entities that match a query before the query (and thus the system) is registered. This typically isn't an issue if you register all components and systems before creating entities.

::: warning
However, if a system (with its queries) needs to be registered later in the execution cycle, it's essential to preemptively register the query configurations with the `QueryManager`. This ensures that when the system is eventually registered, the query has already been collecting the appropriate entities.
:::

#### Query Uniqueness

EliCS treats different query instances with the same configuration (i.e., same required and excluded components) as equivalent. This means that the querying mechanism will function correctly regardless of the specific instance of a query, as long as the configuration matches.

## Usage

### Creating and Using a Query in a System

The `Query` class in EliCS allows systems to efficiently select entities based on their component composition. Here's an updated generic example demonstrating how to create and use such a query:

#### Example System

This example illustrates a system that processes entities with `ComponentA` but not `ComponentC`.

```ts
import { System, Query, Entity } from 'elics';
import { ComponentA, ComponentB, ComponentC } from 'your-components';

class GenericSystem extends System {
	// Define a query for entities with ComponentA but excluding ComponentC
	// Queries will be automatically constructed when the system is initialized
	static queries = {
		entities: { required: [ComponentA], excluded: [ComponentC] },
	};

	update() {
		// Retrieve entities that match the query
		const entities = this.getEntities(GenericSystem.queries.entities);

		entities.forEach((entity: Entity) => {
			const componentA = entity.getComponent(ComponentA);

			// Example operation: creating a new entity and adding ComponentB
			const newEntity = this.world.createEntity();
			newEntity.addComponent(ComponentB);
			newEntity.getComponent(ComponentB).value = componentA.value;
		});
	}
}
```

In this example, `GenericSystem` utilizes a query to select entities that have `ComponentA` but do not have `ComponentC`. The `update` method processes these entities directly, as the query ensures they meet the specified component criteria. This setup effectively demonstrates the power and efficiency of using queries in EliCS to manage entity interactions within systems.

## Constructor

Constructs a new query instance with specified required components and optionally excluded components.

```ts
constructor({ required, excluded }: {
    required: (typeof Component)[],
    excluded?: (typeof Component)[]
})
```

- **required**: `(typeof Component)[]` - An array of component classes that entities must have to match the query.
- **excluded**: `(typeof Component)[]` (optional) - An array of component classes that entities must not have to match the query.

## Properties

### `queryId`

A unique string identifier generated for each query instance, used internally to manage query results.

- **Type**: `string`
- **Readonly**

## Static Methods

### `generateQueryId`

Generates a unique identifier for a query based on required and excluded component bitmasks.

```ts
static generateQueryId(
    requiredComponents: Set<ComponentMask>,
    excludedComponents: Set<ComponentMask>
): string
```

- **requiredComponents**: `Set<ComponentMask>` - A set of bitmasks representing the required components.
- **excludedComponents**: `Set<ComponentMask>` (optional) - A set of bitmasks representing the excluded components.

### `matchesQuery`

Determines if an entity's component composition matches the specified query.

```ts
static matchesQuery(
    queryId: string,
    mask: ComponentMask
): boolean
```

- **queryId**: `string` - The unique identifier of the query.
- **mask**: `ComponentMask` - The component bitmask of an entity.

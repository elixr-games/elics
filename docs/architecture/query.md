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
	static queries = {
		entities: new Query([ComponentA], [ComponentC]),
	};

	update() {
		// Retrieve entities that match the query
		const entities = this.getEntities(GenericSystem.queries.entities);

		entities.forEach((entity: Entity) => {
			// No need to check entity.hasComponent(ComponentA) since the query guarantees it
			const componentA = entity.getComponent(ComponentA);

			// Example operation: creating a new entity and adding ComponentB
			const newEntity = this.world.createEntity();
			newEntity.addComponent(ComponentB);
			// Assuming ComponentB has a property 'value'
			newEntity.getComponent(ComponentB).value = componentA.value;
		});
	}
}
```

In this example, `GenericSystem` utilizes a query to select entities that have `ComponentA` but do not have `ComponentC`. The `update` method processes these entities directly, as the query ensures they meet the specified component criteria. This setup effectively demonstrates the power and efficiency of using queries in EliCS to manage entity interactions within systems.

## Constructor

Constructs a new query instance with specified required and excluded components.

```ts
constructor(
    required: (typeof Component)[],
    excluded?: (typeof Component)[]
)
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
- **excludedComponents**: `Set<ComponentMask>` - A set of bitmasks representing the excluded components.

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

---
outline: deep
---

# World Class

The **World** class is the central hub of the EliCS ECS architecture. It orchestrates entities, components, queries, and systems to provide a robust, high-performance foundation for your application or game.

## Features

- **Component Registration**: Registers components with unique type IDs and BitSet masks, and initializes optimized storage using typed arrays.
- **Entity Management**: Efficiently creates, pools, and recycles entities to minimize memory overhead.
- **System Integration**: Registers systems with customizable configuration and execution priority, automatically wiring up system queries.
- **Query Handling**: Uses BitSet masks for fast entity filtering and supports deferred updates to batch processing.
- **Global State Access**: Provides a shared global object for cross-system communication and configuration.

## Implementation Overview

Under the hood, the **World** class initializes and connects three core managers:

- **ComponentManager**: Handles registration and storage of component data with performance in mind by leveraging typed arrays for cache-friendly access.
- **EntityManager**: Uses an efficient pooling mechanism to create and recycle entities, reducing garbage collection overhead.
- **QueryManager**: Maintains entity queries using BitSet masks for rapid matching and supports deferred entity updates, which are processed after each system update to optimize bulk modifications.

Systems are sorted based on priority during registration, ensuring that lower-priority systems are executed first. This design, along with the use of BitSet operations, contributes to a highly performant ECS implementation ideal for performance-critical applications.

## Usage

Below are some examples of how to set up and use the **World** class in your ECS-powered application.

### Registering a Component

Before a component can be used with entities, it must be registered with the world. The component’s schema defines the data structure, types, and default values.

```ts
import { World, Component, Types } from 'elics';

class PositionComponent extends Component {
	static schema = {
		x: { type: Types.Float32, default: 0 },
		y: { type: Types.Float32, default: 0 },
		z: { type: Types.Float32, default: 0 },
	};
}

const world = new World();
world.registerComponent(PositionComponent);
```

### Creating an Entity

Entities are created dynamically using the `createEntity()` method. Once created, entities can be extended with registered components.

```ts
const entity = world.createEntity();
entity.addComponent(PositionComponent, { x: 10, y: 20, z: 30 });
```

### Registering and Managing Systems

Systems encapsulate application logic and declare their required queries. They are registered with optional configuration data and a priority setting that determines execution order.

```ts
import { System } from 'elics';

class MovementSystem extends System {
	static queries = {
		movingEntities: { required: [PositionComponent] },
	};

	static schema = {
		speed: { type: Types.Float32, default: 1 },
	};

	init(configData: { [key: string]: any }) {
		// Initialize system-specific data, e.g., read configData.speed
		this.config = configData;
	}

	update(delta: number, time: number) {
		const entities = this.getEntities(MovementSystem.queries.movingEntities);
		entities.forEach((entity) => {
			const posX = PositionComponent.data['x'][entity.index];
			console.log(`Updating entity ${entity.index} at position x: ${posX}`);
		});
	}
}

// Register with configuration options:
world.registerSystem(MovementSystem, { configData: { speed: 2 }, priority: 1 });
```

### Registering a Query Separately

While systems automatically register their queries, you can also register standalone queries for custom entity filtering.

```ts
world.registerQuery({
	required: [PositionComponent],
});
```

### Chainable Registration

The registration methods return the **World** instance, allowing for a fluent and concise configuration.

```ts
const world = new World();
world
	.registerComponent(PositionComponent)
	.registerSystem(MovementSystem, { configData: { speed: 2 }, priority: 1 })
	.registerQuery({ required: [PositionComponent] });
```

### Updating the World

The `update()` method processes all active systems and applies deferred entity updates. It should be called once per frame in your main loop.

```ts
function mainLoop(deltaTime: number) {
	world.update(deltaTime, performance.now());
	requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);
```

### Accessing and Controlling Systems

You can retrieve registered systems to control their behavior directly, such as pausing or resuming their execution.

```ts
const movementSystem = world.getSystem(MovementSystem);
if (movementSystem) {
	movementSystem.play(); // Resume system updates
	movementSystem.stop(); // Pause system updates
}
```

## API Documentation

This section details the API of the **World** class, including its constructor, properties, and methods.

### Constructor

**Signature:**

`new World(options?: Partial<WorldOptions>)`

- **Parameters:**
  - `options`: An optional object containing:
    - `entityCapacity` (`number`): Maximum number of entities (default is 1000).
    - `checksOn` (`boolean`): Enables runtime validations (default is true).
    - `deferredEntityUpdates` (`boolean`): If true, defers entity-query updates until after system processing.
- **Description:**  
  Constructs a new instance of the **World** class, initializing the ComponentManager, QueryManager, and EntityManager with the provided configuration options.

### Properties

- `entityManager` (`EntityManager`):  
  Manages the creation, pooling, and recycling of entities.

- `queryManager` (`QueryManager`):  
  Maintains and updates entity queries using BitSet masks.

- `componentManager` (`ComponentManager`):  
  Registers components and initializes their data storage using optimized typed arrays.

- `globals` (`{ [key: string]: any }`):  
  A shared global object accessible to systems for cross-system communication.

### Methods

- `registerComponent(componentClass: ComponentConstructor): World`  
  Registers a new component type with the world.  
  _Returns:_ The **World** instance for method chaining.

- `createEntity(): EntityLike`  
  Creates and returns a new entity instance.  
  _Returns:_ The newly created entity.

- `registerSystem<T extends System>(systemClass: SystemConstructor<T>, options?: Partial<SystemOptions>): World`  
  Registers a system along with its queries. Accepts optional configuration data and a priority value.  
  _Returns:_ The **World** instance for chaining.

- `unregisterSystem<T extends System>(systemClass: SystemConstructor<T>): void`  
  Unregisters and removes a system from the world.

- `registerQuery(queryConfig: QueryConfig): World`  
  Registers a custom query for filtering entities.  
  _Returns:_ The **World** instance for chaining.

- `update(delta: number, time: number): void`  
  Processes the ECS loop by updating each active system and processing any deferred entity updates.  
  _Parameters:_

  - `delta`: Time elapsed since the last update (in milliseconds).
  - `time`: Total elapsed time since application start.

- `getSystem<T extends System>(systemClass: SystemConstructor<T>): T | undefined`  
  Retrieves a registered system instance by its constructor.  
  _Returns:_ The system instance if found; otherwise, `undefined`.

- `getSystems(): System[]`  
  Returns an array of all registered system instances.  
  _Returns:_ An array of system instances.

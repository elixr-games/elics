---
outline: deep
---

# World

The **World** class is the central hub of the EliCS ECS architecture. It orchestrates entities, components, queries, and systems to provide a robust, high-performance foundation for your application or game.

## Features

- **Component Registration**: Registers components with unique type IDs and BitSet masks, and initializes optimized storage using typed arrays.
- **Entity Management**: Efficiently creates, pools, and recycles entities to minimize memory overhead.
- **System Integration**: Registers systems with customizable configuration and execution priority, automatically wiring up system queries.
- **Query Handling**: Uses BitSet masks for fast entity filtering and supports deferred updates to batch processing.
- **Global State Access**: Provides a shared `globals` object for cross-system communication and configuration.

## Implementation Overview

Under the hood, the **World** class initializes and connects three core managers:

- **ComponentManager**: Handles registration and storage of component data with performance in mind by leveraging typed arrays for cache-friendly access.
- **EntityManager**: Uses an efficient pooling mechanism to create and recycle entities, reducing garbage collection overhead.
- **QueryManager**: Maintains entity queries using BitSet masks for rapid matching and supports deferred entity updates, which are processed after each system update to optimize bulk modifications.

Systems are sorted based on priority during registration, ensuring that lower-priority systems are executed first. This design, along with the use of BitSet operations, contributes to a highly performant ECS implementation ideal for performance-critical applications.

## Usage

Below are some examples of how to set up and use the **World** class in your ECS-powered application.

### Creating a World Instance

To get started, create a new instance of the **World** class, which initializes the core managers and sets up the ECS environment.

```ts
import { World } from 'elics';

const world = new World();
```

### Registering Components and Systems

After creating the world instance, you can register [components](./component.md) and [systems](./system.md) to define the application's behavior and logic.

```ts
import { PositionComponent, MovementSystem } from './movement';

world.registerComponent(PositionComponent).registerSystem(MovementSystem);
```

System queries have dependencies on components, so it's generally a good practice to register components before systems.

### Updating the World

To process the ECS loop, call the `update()` method on the world instance once per frame in your application's main loop.

```ts
function mainLoop(deltaTime: number) {
	world.update(deltaTime, performance.now());
	requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);
```

The `update()` method serves as the master control for the ECS loop, updating all active systems. It's very useful for implementing features like global pause/resume functionality or time scaling.

## API Documentation

This section details the API of the **World** class, including its constructor, properties, and methods.

### WorldOptions

An interface that defines the configuration options for the **World** class.

```ts
interface WorldOptions {
        entityCapacity: number;
        checksOn: boolean;
        deferredEntityUpdates: boolean;
}
```

- `entityCapacity` (`number`): The maximum number of entities the world can manage (default is 1000).
- `checksOn` (`boolean`): Enables runtime validations for debugging purposes (default is true). It's recommended to disable checks in production for better performance.
- `deferredEntityUpdates` (`boolean`): When `true`, entity changes are batched and processed after all systems update (default is false).

### World.constructor

Constructor for the **World** class.

```ts
new World(options?: Partial<WorldOptions>)
```

- **Parameters:**
  - `options`: An optional object containing configuration options. See [**WorldOptions**](#worldoptions) for details.

### World.createEntity

Creates and returns a new entity instance.

```ts
createEntity(): Entity;
```

- **Returns:** The newly created entity.

### World.registerComponent

Registers a new component type with the world.

```ts
registerComponent(component: Component): this;
```

- **Parameters:**
  - `component`: The component instance to register.
- **Returns:** The **World** instance for method chaining.

### World.registerSystem

Registers a system along with its queries.

```ts
registerSystem(system: System, options?: Partial<SystemOptions>): this;
```

- **Parameters:**
  - `system`: The system instance to register.
  - `options`: An optional object containing configuration data and a priority value.
- **Returns:** The **World** instance for method chaining.

### World.unregisterSystem

Unregisters and removes a system from the world.

```ts
unregisterSystem(system: System): void;
```

- **Parameters:**
  - `system`: The system instance to unregister.

### World.registerQuery

Registers a query outside of a system context.

```ts
registerQuery(queryConfig: QueryConfig): this;
```

- **Parameters:**
  - `queryConfig`: The query configuration object.
- **Returns:** The **World** instance for method chaining.

### World.getSystem

Retrieves a registered system instance by its constructor.

```ts
getSystem<T extends System>(systemClass: SystemConstructor<T>): T | undefined;
```

- **Parameters:**
  - `systemClass`: The system constructor to look up.
- **Returns:** The system instance if found; otherwise, `undefined`.

### World.getSystems

Returns an array of all registered system instances.

```ts
getSystems(): System[];
```

- **Returns:** An array of system instances.

### World.update

Processes the ECS loop by updating each active system and processing any deferred entity updates.

```ts
update(delta: number, time: number): void;
```

- **Parameters:**
  - `delta`: Time elapsed since the last update (in seconds).
  - `time`: Total elapsed time since application start.

### World.globals

A global object for storing shared state or configuration data accessible by all systems.

```ts
globals: Record<string, any>;
```

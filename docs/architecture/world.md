---
outline: deep
---

# World Class

The `World` class in EliCS orchestrates the interactions of entities, components, and systems, central to managing the ECS architecture in web applications.

## Features

- **Component Registration**: Simplifies the process of registering components for entity construction.
- **Entity Management**: Facilitates efficient creation and management of entities.
- **System Integration**: Enables the integration and coordination of systems for implementing application logic.

## Usage

### Registering a Component

```ts
import { World, Component } from 'elics';

class YourComponent extends Component {
	// Component implementation
}

const world = new World();
world.registerComponent(YourComponent);
```

### Creating an Entity

```ts
const entity = world.createEntity();
```

### Registering and Managing Systems

```ts
import { System } from 'elics';

class YourSystem extends System {
	// System implementation
}

world.registerSystem(YourSystem);
```

### Updating the World

To be called within your application's main loop:

```ts
function mainLoop(deltaTime: number) {
	world.update(deltaTime, performance.now());
	requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);
```

### Accessing Systems

```ts
const yourSystemInstance = world.getSystem(YourSystem);
```

## Methods

### `registerComponent`

Registers a new component type in the world.

```ts
registerComponent<T extends typeof Component>(componentClass: T): void
```

- **componentClass** (`T` extends `typeof Component`): Class of the component to be registered.
- **Returns**: `void`.

### `createEntity`

Creates and returns a new entity in the world.

```ts
createEntity(): Entity
```

- **Returns** (`Entity`): The newly created entity.

### `registerSystem`

Registers a new system in the world, with an optional execution priority.

```ts
registerSystem(systemClass: typeof System, priority?: number): void
```

- **systemClass** (`typeof System`): Class of the system to be registered.
- **priority** (`number`, optional): Execution priority, where lower values indicate higher priority.
- **Returns**: `void`.

### `unregisterSystem`

Removes a system from the world's execution cycle.

```ts
unregisterSystem(systemClass: typeof System): void
```

- **systemClass** (`typeof System`): The system class to be unregistered.
- **Returns**: `void`.

### `update`

Updates all registered systems in the world based on the given delta time and total elapsed time.

```ts
update(delta: number, time: number): void
```

- **delta** (`number`): The delta time since the last update.
- **time** (`number`): The total time elapsed since the beginning of execution.
- **Returns**: `void`.

### `getSystem`

Fetches a specific system instance by its class.

```ts
getSystem<T extends System>(systemClass: new (...args: any[]) => T): T | undefined
```

- **systemClass** (`new (...args: any[]) => T`): The constructor of the system class.
- **Returns** (`T | undefined`): The instance of the requested system or `undefined` if not found.

### `getSystems`

Provides a list of all currently registered systems.

```ts
getSystems(): System[]
```

- **Returns** (`System[]`): An array of registered system instances.

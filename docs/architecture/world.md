---
outline: deep
---

# World Class

The `World` class in EliCS serves as the central manager of the Entity-Component-System (ECS) architecture, orchestrating the interactions between entities, components, and systems.

## Features

- **Component Registration**: Simplifies registering components for structured entity construction.
- **Entity Management**: Provides efficient creation, pooling, and management of entities.
- **System Integration**: Coordinates systems for implementing application logic in a prioritized manner.
- **Query Handling**: Enables advanced filtering of entities based on their component composition.

---

## Usage

### Registering a Component

Components must be registered with the `World` before they can be used with entities:

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

---

### Creating an Entity

Entities are created dynamically and can be extended with components:

```ts
const entity = world.createEntity();
entity.addComponent(PositionComponent, { x: 10, y: 20, z: 30 });
```

---

### Registering and Managing Systems

Define systems to process entity logic:

```ts
import { System } from 'elics';

class MovementSystem extends System {
	static queries = {
		movingEntities: { required: [PositionComponent] },
	};

	update(delta: number) {
		const entities = this.getEntities(MovementSystem.queries.movingEntities);
		entities.forEach((entity) => {
			const position = PositionComponent.data['x'][entity.index];
			console.log(`Updating entity position: ${position}`);
		});
	}
}

world.registerSystem(MovementSystem, 1); // Assign priority
```

---

### Chainable Registration

Method chaining allows for a clean and concise configuration of the world:

```ts
const world = new World();
world
	.registerComponent(PositionComponent)
	.registerSystem(MovementSystem, 1)
	.registerQuery({
		required: [PositionComponent],
	});
```

---

### Updating the World

The `update` method drives the ECS loop, invoking system updates. Typically called within your application's main loop:

```ts
function mainLoop(deltaTime: number) {
	world.update(deltaTime, performance.now());
	requestAnimationFrame(mainLoop);
}

requestAnimationFrame(mainLoop);
```

---

### Accessing Systems

Retrieve instances of registered systems for direct interaction:

```ts
const movementSystem = world.getSystem(MovementSystem);
movementSystem.play(); // Resume execution
movementSystem.stop(); // Pause execution
```

---

## Methods

### `registerComponent`

Registers a new component type and returns the `World` instance for chaining.

```ts
registerComponent<T extends typeof Component>(componentClass: T): World
```

- **componentClass**: The class of the component to register.
- **Returns**: `World` - The `World` instance for chaining.

---

### `createEntity`

Creates and returns a new entity instance.

```ts
createEntity(): EntityLike
```

- **Returns**: `EntityLike` - The newly created entity.

---

### `registerSystem`

Registers a system with an optional execution priority and returns the `World` instance for chaining.

```ts
registerSystem<T extends System>(
	systemClass: new (...args: any[]) => T,
	priority?: number,
): World
```

- **systemClass**: The constructor of the system class to register.
- **priority**: (Optional) Execution priority (higher values indicate earlier execution).
- **Returns**: `World` - The `World` instance for chaining.

---

### `unregisterSystem`

Removes a system from the world.

```ts
unregisterSystem<T extends System>(systemClass: new (...args: any[]) => T): void
```

- **systemClass**: The constructor of the system class to remove.
- **Returns**: `void`.

---

### `registerQuery`

Registers a query for entity filtering and returns the `World` instance for chaining.

```ts
registerQuery(queryConfig: QueryConfig): World
```

- **queryConfig**: Object specifying `required` and optionally `excluded` components.
- **Returns**: `World` - The `World` instance for chaining.

---

### `update`

Updates all registered systems in the world. Typically called each frame.

```ts
update(delta: number, time: number): void
```

- **delta**: Time since the last update (in milliseconds).
- **time**: Total elapsed time since application start.
- **Returns**: `void`.

---

### `getSystem`

Retrieves a specific system instance by its class.

```ts
getSystem<T extends System>(
	systemClass: new (...args: any[]) => T,
): T | undefined
```

- **systemClass**: The constructor of the system class to retrieve.
- **Returns**: The system instance, or `undefined` if not registered.

---

### `getSystems`

Returns a list of all registered system instances.

```ts
getSystems(): System[]
```

- **Returns**: `System[]` - Array of system instances.

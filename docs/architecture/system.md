---
outline: deep
---

# System Class

The **System** class in EliCS is a blueprint for implementing application logic within the Entity-Component-System architecture. It defines the lifecycle and behavior of systems, enabling them to process entities based on defined queries, manage their execution state, and maintain a defined order through prioritization.

## Features

- **Entity Querying**: Automatically processes entities that match defined component criteria via static queries.
- **Lifecycle Management**: Offers hooks to initialize, update, pause, and resume system execution.
- **Execution Priority**: Supports prioritization so that systems execute in a specific order, based on their assigned priority.
- **Initialization and Updates**: Provides clear methods (`init` and `update`) to set up and execute per-frame logic.

## Implementation Overview

Under the hood, the **System** class is designed to integrate seamlessly with the **World** and its associated managers. When a system is registered with the world, its static queries are automatically wired up through the **QueryManager**, ensuring efficient filtering of entities using BitSet operations. The class also exposes methods to control its execution state (`play` and `stop`), which is essential for managing complex simulation or game loops. This design minimizes overhead by relying on lightweight query evaluations and prioritization logic that arranges systems in a cache-friendly order.

## Usage

Below are some examples demonstrating how to extend and use the **System** class within an ECS-powered application. These examples illustrate defining queries, implementing initialization and update logic, and controlling the system's lifecycle.

### Example: `EnemySystem`

The following example shows how to create an `EnemySystem` that processes entities with an `EnemyComponent`:

```ts
import { System, Entity } from 'elics';
import { EnemyComponent } from './EnemyComponent';

class EnemySystem extends System {
	static queries = {
		enemies: {
			required: [EnemyComponent],
		},
	};

	init(): void {
		console.log('EnemySystem initialized');
	}

	update(delta: number, time: number): void {
		const enemies = this.getEntities(EnemySystem.queries.enemies);
		enemies.forEach((enemy: Entity) => {
			const health = EnemyComponent.data['health'][enemy.index];
			if (health <= 0) {
				EnemyComponent.data['isAlive'][enemy.index] = 0;
				console.log(`Enemy at index ${enemy.index} is dead.`);
			}
		});
	}
}
```

Systems are initialized automatically when registered with the **World**:

```ts
const world = new World();
world.registerSystem(EnemySystem);
```

You can control a system's execution state using the `play()` and `stop()` methods:

```ts
const enemySystem = world.getSystem(EnemySystem);
enemySystem.play(); // Resume system updates
enemySystem.stop(); // Pause system updates
```

For more complex scenarios, a system may define multiple queries or be registered with a specific priority to control execution order:

```ts
class CombatSystem extends System {
	static queries = {
		enemies: { required: [EnemyComponent] },
		players: { required: [PlayerComponent] },
	};

	update(delta: number, time: number): void {
		const enemies = this.getEntities(CombatSystem.queries.enemies);
		const players = this.getEntities(CombatSystem.queries.players);
		// Process combat interactions between players and enemies
	}
}

// Priority-based registration
world.registerSystem(PhysicsSystem, { priority: 10 }); // High priority
world.registerSystem(RenderingSystem, { priority: 0 }); // Low priority
```

## API Documentation

This section provides detailed information on the **System** class API, including its constructor, properties, and methods.

### Constructor

**Signature:**

```
new System(world: World, queryManager: QueryManager, priority: number)
```

- **Parameters:**
  - `world`: An instance of `World` that the system is registered with.
  - `queryManager`: The `QueryManager` instance responsible for handling queries.
  - `priority`: A `number` representing the system's execution order (lower numbers are executed earlier).
- **Description:**  
  Constructs a new instance of the **System** class. Note that the class is abstract and should be extended to implement the `init()` and `update()` methods.

### Properties

- `world` (`World`):  
  Provides access to the `World` instance the system is registered with. (Read-only)

- `isPaused` (`boolean`):  
  Indicates whether the system is currently paused.

- `queries` (`{ [key: string]: Query }`):  
  A mapping of query names to `Query` objects, automatically registered during system initialization.

- `priority` (`number`):  
  Determines the system's execution order. Higher values indicate higher priority, ensuring the system is processed earlier in the update cycle.

### Methods

- `getEntities(query: Query): Entity[]`  
  Retrieves an array of entities that match the specified `query`.

  - **Parameters:**
    - `query`: An instance of `Query` used to filter entities.
  - **Returns:** An array of entities matching the query.

- `init(configData: { [key: string]: any }): void`  
  Called once immediately after the system is registered with the `World`. This method should be overridden to include any initialization logic.

  - **Returns:** `void`.

- `update(delta: number, time: number): void`  
  Called every frame while the system is active. Override this method to implement per-frame logic.

  - **Parameters:**
    - `delta`: A `number` representing the time elapsed since the last frame.
    - `time`: A `number` representing the total elapsed time since the application started.
  - **Returns:** `void`.

- `play(): void`  
  Resumes the system's execution if it is paused.

  - **Returns:** `void`.

- `stop(): void`  
  Pauses the system's execution.
  - **Returns:** `void`.

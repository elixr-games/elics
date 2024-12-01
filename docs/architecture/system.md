---
outline: deep
---

# System Class

The `System` class in EliCS is essential for implementing application logic in the Entity-Component-System architecture. Systems define how entities and their components interact, enabling efficient and structured processing.

## Features

- **Entity Querying**: Automatically processes entities that match specified component criteria through queries.
- **Lifecycle Management**: Provides methods to control execution state, such as starting, pausing, or stopping systems.
- **Execution Priority**: Supports prioritization of systems, ensuring proper execution order based on dependencies or criticality.
- **Initialization and Updates**: Includes hooks for initialization and per-frame update logic.

## Example: `EnemySystem`

To demonstrate the usage of the `System` class, consider `EnemySystem`, which processes entities with an `EnemyComponent`:

```ts
import { System, Entity } from 'elics';
import { EnemyComponent } from './EnemyComponent';

class EnemySystem extends System {
	static queries = {
		enemies: {
			required: [EnemyComponent],
		},
	};

	init() {
		console.log('EnemySystem initialized');
	}

	update(delta: number, time: number) {
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

### Key Features Demonstrated:

1. **Query Definition**: Processes entities with `EnemyComponent`.
2. **Initialization**: Executes custom logic during system registration.
3. **Per-Frame Updates**: Iterates through matching entities and processes their data.

## System Lifecycle

### System Initialization

Systems are initialized when registered with the `World`. The `init` method is automatically invoked at this stage.

```ts
const world = new World();
world.registerSystem(EnemySystem);
```

### Controlling Execution

Control the execution state of systems using `play` and `stop` methods:

```ts
const enemySystem = world.getSystem(EnemySystem);

// Resume execution
enemySystem.play();

// Pause execution
enemySystem.stop();
```

## Properties

### `world`

(Readonly) Provides access to the `World` instance the system is registered with.

- **Type**: `World`

### `isPaused`

Indicates whether the system is currently paused.

- **Type**: `boolean`

### `queries`

A mapping of query names to `Query` objects, automatically registered during initialization.

- **Type**: `{ [key: string]: Query }`

### `priority`

The execution priority of the system. Higher values indicate higher priority, ensuring earlier execution during the update cycle.

- **Type**: `number`

## Methods

### `getEntities`

Retrieves entities that match a specified query.

```ts
getEntities(query: Query): Entity[]
```

- **query**: `Query` - The query used to filter entities.
- **Returns**: `Entity[]` - An array of entities matching the query.

### `init`

Called once after the system is registered with the `World`. This method is intended for setup or initialization logic.

```ts
init(): void
```

Example:

```ts
init() {
	console.log('Initializing EnemySystem');
}
```

### `update`

Called every frame while the system is active. This method should be overridden to implement custom logic.

```ts
update(delta: number, time: number): void
```

- **delta**: `number` - Time elapsed since the last frame, useful for time-based calculations.
- **time**: `number` - Total time since the application started.

Example:

```ts
update(delta: number, time: number) {
	const enemies = this.getEntities(EnemySystem.queries.enemies);
	enemies.forEach((enemy: Entity) => {
		console.log(`Updating enemy at index ${enemy.index}`);
	});
}
```

### `play`

Resumes the system's execution if it is paused.

```ts
play(): void
```

Example:

```ts
const system = world.getSystem(EnemySystem);
system.play();
```

### `stop`

Pauses the system's execution.

```ts
stop(): void
```

Example:

```ts
const system = world.getSystem(EnemySystem);
system.stop();
```

## Usage in Complex Scenarios

### Multiple Queries

A system can define multiple queries to process different types of entities. For example:

```ts
class CombatSystem extends System {
	static queries = {
		enemies: { required: [EnemyComponent] },
		players: { required: [PlayerComponent] },
	};

	update(delta: number, time: number) {
		const enemies = this.getEntities(CombatSystem.queries.enemies);
		const players = this.getEntities(CombatSystem.queries.players);

		// Process combat interactions between players and enemies
	}
}
```

### Priority-Based Execution

Assign priorities to ensure critical systems execute first. For example, a physics system might have higher priority than a rendering system:

```ts
world.registerSystem(PhysicsSystem, 10); // High priority
world.registerSystem(RenderingSystem, 0); // Low priority
```

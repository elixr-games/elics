---
outline: deep
---

# System

The **System** class in EliCS is a blueprint for implementing application logic within the Entity-Component-System architecture. It defines the lifecycle and behavior of systems, enabling them to process entities based on defined queries, manage their execution state, and maintain a defined order through prioritization.

## Features

- **Entity Querying**: Automatically processes entities that match defined component criteria via static queries.
- **Lifecycle Management**: Offers hooks to initialize, update, pause, and resume system execution.
- **Execution Priority**: Supports prioritization so that systems execute in a specific order, based on their assigned priority.
- **Initialization and Updates**: Provides clear methods (`init` and `update`) to set up and execute per-frame logic.

## Implementation Overview

Under the hood, the **System** class is designed to integrate seamlessly with the **World** and its associated managers. When a system is registered with the world, its static queries are automatically wired up through the **QueryManager**, ensuring efficient filtering of entities using BitSet operations. The class also exposes methods to control its execution state (`play` and `stop`), which is essential for managing complex simulation or game loops. This design minimizes overhead by relying on lightweight query evaluations and prioritization logic that arranges systems in a cache-friendly order.

## Usage

Below are some examples demonstrating how to extend and use the **System** class within an ECS-powered application. These examples illustrate defining queries, implementing initialization and update logic, and controlling the system's lifecycle. The following example shows how to create an `EnemySystem` that processes entities with an `EnemyComponent`:

```ts
import { createSystem, Entity } from 'elics';
import { EnemyComponent } from './EnemyComponent';

const queries = {
	enemies: { required: [EnemyComponent] },
};

const schema = {
	healthRegen: { type: Types.Float32, default: 0.5 },
};

class EnemySystem extends createSystem(queries, schema) {
	init(): void {
		this.queries.enemies.subscribe('qualify', (entity: Entity) => {
			console.log('new enemy entity:', entity);
		});
	}

	update(delta: number, time: number): void {
		this.queries.enemies.entities.forEach((enemy: Entity) => {
			EnemyComponent.data['health'][enemy.index] +=
				this.config.healthRegen * delta;
		});
	}
}
```

### System Schema

The system schema defines configuration data that can be passed to the system during initialization as a [TypedSchema](./types.md#typedschema-interface). This data can be used to customize system behavior based on specific requirements, for example:

```ts
const schema = {
	healthRegen: { type: Types.Float32, default: 0.5 },
};
```

When registering the system with the **World**, you can provide (partial) configuration data to override the default values:

```ts
world.registerSystem(EnemySystem, { configData: { healthRegen: 1.0 } });
```

Once the system is registered with the **World**, the configuration data can be accessed via the `config` property:

```ts
update() {
	const healthRegen = this.config.healthRegen;
	// Use healthRegen value in system logic
}
```

### Defining a System

You can define a system by generating a new base system class using the `createSystem` function, which takes query configuration (see [Query Creation](./query.md#query-creation) for more details) and an optional configuration schema as arguments. The resulting class can be extended to implement the `init` and `update` methods:

```ts
class EnemySystem extends createSystem(queries, schema) {
	init(): void {
		// Initialization logic
	}

	update(delta: number, time: number): void {
		// Per-frame logic
	}
}
```

- **`init()`**: Called once immediately after the system is registered with the **World**. Use this method to perform any setup or initialization logic required by the system.
- **`update(delta: number, time: number)`**: Called every frame while the system is active. Implement this method to define the system's per-frame logic. The `delta` parameter represents the time elapsed since the last frame in **seconds**, while `time` represents the total elapsed time since the application started.

### System Lifecycle

Systems are initialized automatically when registered with the **World**. In addition to the `configData`, you can specify a `priority` value to control the system's execution order, with higher values indicating higher priority:

```ts
const world = new World();
world.registerComponent(EnemyComponent).registerSystem(EnemySystem, {
	configData: { healthRegen: 0.5 },
	priority: 10,
});
```

After registration, the `update` method of the systems is called every time the **World** is updated, in the order defined by their priorities. You can also control a system's local execution state using the `play()` and `stop()` methods:

```ts
const enemySystem = world.getSystem(EnemySystem);
enemySystem.play(); // Resume system updates
enemySystem.stop(); // Pause system updates
```

## API Documentation

This section provides detailed information about the **System** API in EliCS.

::: info
You should not instantiate a `System` directly using the constructor. Instead, register a system with the `World` instance using the `registerSystem` method.
:::

### createSystem Function

creates a new base system class with the specified query configuration and optional configuration schema.

```ts
function createSystem(
	queries: Record<string, { required: Component[]; excluded?: Component[] }>,
	schema?: TypedSchema,
): SystemConstructor;
```

- **Parameters:**
  - `queries`: A query configuration object specifying the required and excluded components for each query.
  - `schema` (optional): A schema object defining configuration data for the system.
- **Returns:** A new base system class that can be extended to implement custom system logic.

### System.world

Provides access to the `World` instance the system is registered with. This property is read-only.

```ts
readonly world: World;
```

### System.isPaused

Indicates whether the system is currently paused.

```ts
readonly isPaused: boolean;
```

### System.queries

A mapping of query names to `Query` objects, automatically assigned during system initialization.

```ts
readonly queries: { [key: keyof System.schema]: Query };
```

### System.priority

Determines the system's execution order. Higher values indicate higher priority, ensuring the system is processed earlier in the update cycle.

```ts
priority: number;
```

### System.config

A mapping of configuration property names to reactive signals containing the system's configuration data. Each configuration property is a signal that can be read, written, and subscribed to for reactive updates.

::: info Signal Implementation
EliCS uses `@preact/signals-core` for reactive configuration. Signals provide automatic dependency tracking and efficient updates when values change.
:::

```ts
config: Record<keyof SystemSchema, Signal<any>>;
```

**Reading Configuration Values:**

```ts
class HealthSystem extends createSystem(queries, {
	healthDecreaseRate: { type: Types.Float32, default: 10 },
	regenerationEnabled: { type: Types.Boolean, default: false },
}) {
	update(delta: number): void {
		const rate = this.config.healthDecreaseRate.value;
		const regenEnabled = this.config.regenerationEnabled.value;
		// Use configuration values in system logic
	}
}
```

**Subscribing to Configuration Changes:**
You can subscribe to configuration changes to react dynamically when values are updated at runtime:

```ts
class AdaptiveHealthSystem extends createSystem(queries, {
	healthDecreaseRate: { type: Types.Float32, default: 10 },
	difficultyMultiplier: { type: Types.Float32, default: 1.0 },
}) {
	private effectiveRate = 10;

	init(): void {
		// Subscribe to configuration changes
		this.config.healthDecreaseRate.subscribe((newRate) => {
			console.log(`Health decrease rate changed to: ${newRate}`);
			this.recalculateEffectiveRate();
		});

		this.config.difficultyMultiplier.subscribe((newMultiplier) => {
			console.log(`Difficulty multiplier changed to: ${newMultiplier}`);
			this.recalculateEffectiveRate();
		});

		// Initial calculation
		this.recalculateEffectiveRate();
	}

	private recalculateEffectiveRate(): void {
		this.effectiveRate =
			this.config.healthDecreaseRate.value *
			this.config.difficultyMultiplier.value;
	}

	update(delta: number): void {
		// Use the pre-calculated effective rate
		this.queries.entities.entities.forEach((entity) => {
			const currentHealth = entity.getValue(HealthComponent, 'value');
			entity.setValue(
				HealthComponent,
				'value',
				currentHealth - this.effectiveRate * delta,
			);
		});
	}
}
```

**Updating Configuration at Runtime:**
Configuration can be updated externally, triggering subscribed reactions:

```ts
// In your game logic or UI
const healthSystem = world.getSystem(AdaptiveHealthSystem);

// Change difficulty dynamically
healthSystem.config.difficultyMultiplier.value = 2.0; // Triggers subscription

// Temporarily boost health decrease rate
healthSystem.config.healthDecreaseRate.value = 25; // Triggers subscription
```

**Computed Reactions:**
You can create computed values that automatically update when dependencies change:

```ts
class WeatherSystem extends createSystem(queries, {
	temperature: { type: Types.Float32, default: 20 },
	humidity: { type: Types.Float32, default: 50 },
}) {
	private comfortIndex = 0;

	init(): void {
		// Create a computed reaction that updates when either temperature or humidity changes
		const updateComfortIndex = () => {
			const temp = this.config.temperature.value;
			const humid = this.config.humidity.value;
			this.comfortIndex = temp - humid * 0.1;
			console.log(`Comfort index updated to: ${this.comfortIndex}`);
		};

		// Subscribe to both config changes
		this.config.temperature.subscribe(updateComfortIndex);
		this.config.humidity.subscribe(updateComfortIndex);

		// Initial calculation
		updateComfortIndex();
	}
}
```

### System.globals

Provides access to the world's global state object for cross-system communication.

```ts
readonly globals: Record<string, any>;
```

**Example:**

```ts
class GameSystem extends createSystem() {
	init(): void {
		this.globals.gameState = 'running';
	}

	update(): void {
		if (this.globals.gameState === 'paused') {
			return; // Skip update when paused
		}
	}
}
```

### System.init

Called once immediately after the system is registered with the `World`. Override this method to include any initialization logic.

```ts
init(): void;
```

### System.update

Called every frame while the system is active. Override this method to implement per-frame logic.

```ts
update(delta: number, time: number): void;
```

### System.play

Resumes the system's execution if it is paused.

```ts
play(): void;
```

### System.stop

Pauses the system's execution.

```ts
stop(): void;
```

### System.createEntity

Creates a new entity through the system's world instance. This is a convenience method equivalent to calling `this.world.createEntity()`.

```ts
createEntity(): Entity;
```

- **Returns:** A newly created entity instance.

**Example:**

```ts
class SpawnerSystem extends createSystem(queries) {
	update(delta: number): void {
		// Spawn a new enemy entity
		const enemy = this.createEntity();
		enemy.addComponent(PositionComponent, { x: 100, y: 50 });
		enemy.addComponent(EnemyComponent);
	}
}
```

### System.destroy

Called when the system is unregistered from the world. Override this method to include cleanup logic.

```ts
destroy(): void;
```

**Example:**

```ts
class NetworkSystem extends createSystem() {
	private connection: WebSocket;

	init(): void {
		this.connection = new WebSocket('ws://localhost:8080');
	}

	destroy(): void {
		this.connection.close();
		console.log('NetworkSystem cleaned up');
	}
}
```

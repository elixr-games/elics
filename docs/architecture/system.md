---
outline: deep
---

# System Class

The `System` class in EliCS is essential for implementing the logic that operates on entities and their components in the Entity-Component-System architecture. It enables efficient execution and management of application logic.

## Features

- **Lifecycle Management**: Offers functionality to control the execution state of the system, such as playing or stopping.
- **Execution Priority**: Systems can be prioritized for execution order, where systems with lower priority numbers are executed first.
- **Entity Processing**: Acts as a framework where developers can define custom logic to query and process entities based on their components.

## Usage

### Defining a System

```ts
import { System, Query, Entity } from 'elics';

class YourSystem extends System {
	static queries = {
		yourQuery: new Query([
			/* component types */
		]),
	};

	init() {
		// Initialization logic
	}

	update(delta: number, time: number) {
		// Update logic
		const entities = this.getEntities(YourSystem.queries.yourQuery);
		// Process entities
	}
}

const world = new World();
world.registerSystem(YourSystem);
```

### Controlling System Lifecycle

```ts
const yourSystemInstance = world.getSystem(YourSystem);
yourSystemInstance.play();
yourSystemInstance.stop();
```

## Properties

### `world`

(Readonly) Access to the world instance.

- **Type**: `World`

### `isPaused`

(Readonly) Indicates whether the system is currently paused.

- **Type**: `boolean`

### `queries`

(Readonly) Queries registered in the system.

- **Type**: `{ [key: string]: Query }`

### `priority`

Execution priority of the system. Lower values indicate higher priority.

- **Type**: `number`

## Methods

### `getEntities`

Retrieves entities that match a given query.

```ts
getEntities(query: Query): Entity[]
```

- **query**: `Query` - The query to match entities against.
- **Returns**: `Entity[]` - An array of matching entities.

### `init`

Initialization method for the system, executed immediately after the system is registered.

```ts
init(): void
```

### `update`

The update method is called each frame and is intended to be overridden with custom logic.

```ts
update(delta: number, time: number): void
```

- **delta**: `number` - Delta time since the last update.
- **time**: `number` - Total time elapsed since the start of the application.

### `play`

Resumes the execution of the system.

```ts
play(): void
```

### `stop`

Pauses the execution of the system.

```ts
stop(): void
```

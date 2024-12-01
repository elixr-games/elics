---
outline: deep
---

# Getting Started

This guide will walk you through the fundamental concepts of the Entity Component System (ECS) framework and get you up and running with EliCS in your TypeScript or JavaScript projects.

## ECS Principles

EliCS is an Entity Component System (ECS) framework tailored for TypeScript and JavaScript applications. This design pattern shifts from traditional class hierarchy to composition within a Data-Oriented Programming paradigm, leading to more efficient and extendable code.

### Key ECS Terms

- [**Entities**](architecture/entity.md): Unique objects that can have multiple components attached.
- [**Components**](architecture/component.md): Varied facets of an entity (e.g., geometry, physics, health). They typically store data.
- [**Systems**](architecture/system.md): Code pieces that process entities and modify their components.
- [**Queries**](architecture/query.md): Used by systems to select entities based on component composition.
- [**World**](architecture/world.md): A container for entities, components, systems, and queries.

### Typical ECS Workflow

1. **Create Component Types**: Define your application's data structures.
2. **Create Entities**: Instantiate entities and attach components.
3. **Create Systems**: Implement logic that processes entities based on queries.
4. **Execute Systems**: Continuously run all systems.

## Adding EliCS to Your Project

Install EliCS via npm:

```bash
npm install elics
```

## Creating a World

The "world" is where all ECS elements coexist.

```typescript
import { World } from 'elics';

const world = new World();
```

## Defining Components

Components in EliCS are versatile classes. You do not need to specify a schema for Components, but you can define default values for their properties.

```typescript
class Position extends Component {
	static schema = {
		value: { type: Types.Vec3, default: [0, 0, 0] },
	};
}

class Velocity extends Component {
	static schema = {
		value: { type: Types.Vec3, default: [0, 0, 0] },
	};
}

class Health extends Component {
	static schema = {
		value: { type: Types.Float32, default: 100 },
	};
}
```

Register these components:

```typescript
world
	.registerComponent(Position)
	.registerComponent(Velocity)
	.registerComponent(Health);
```

## Creating Entities

Instantiate entities and attach components:

```typescript
const entity = world.createEntity();
entity.addComponent(Position, { value: [10, 20, 30] });
entity.addComponent(Velocity);
entity.addComponent(Health);
```

## Creating Systems

Systems contain the core logic.

```typescript
import { System } from 'elics';

class MovementSystem extends System {
	update(delta, time) {
		const movables = this.getEntities(this.queries.movables);
	}
}

MovementSystem.queries = {
	movables: { required: [Position, Velocity] },
};

world.registerSystem(MovementSystem);
```

## Updating the World

Update the world with `delta` and `time`.

```typescript
function render() {
  ...
	world.update(delta, time);
  ...
}
```

## What's Next?

- **[Explore the Architecture](architecture/overview.md)**: Delve into the architecture of EliCS and access the detailed API documentation for an in-depth understanding of EliCS's capabilities.
- **[Discover the EliCS Story](introduction.md)**: Learn about its origins, the inspirations that shaped it, and the design philosophy that drives its development.

EliCS is ready to power your next application with its flexible and efficient ECS framework. Happy coding!

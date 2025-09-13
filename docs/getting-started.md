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

Components are data containers that define entity properties.

```typescript
import { createComponent, Types } from 'elics';

// Define enums for type-safe state management using const assertions
const UnitType = {
	Infantry: 'infantry',
	Cavalry: 'cavalry',
	Archer: 'archer',
} as const;

const CombatState = {
	Idle: 'idle',
	Moving: 'moving',
	Attacking: 'attacking',
	Defending: 'defending',
} as const;

const Position = createComponent(
	'Position',
	{
		value: { type: Types.Vec3, default: [0, 0, 0] },
	},
	'3D position coordinates',
);

const Velocity = createComponent(
	'Velocity',
	{
		value: { type: Types.Vec3, default: [0, 0, 0] },
	},
	'3D velocity vector',
);

const Health = createComponent(
	'Health',
	{
		value: { type: Types.Float32, default: 100 },
	},
	'Entity health points',
);

const Unit = createComponent(
	'Unit',
	{
		type: { type: Types.Enum, enum: UnitType, default: UnitType.Infantry },
		state: { type: Types.Enum, enum: CombatState, default: CombatState.Idle },
		damage: { type: Types.Float32, default: 10, min: 1, max: 100 },
		armor: { type: Types.Int16, default: 0, min: 0, max: 50 },
		morale: { type: Types.Float32, default: 1.0, min: 0.0, max: 1.0 },
	},
	'Military unit with combat statistics',
);
```

Each component is assigned a unique ID and optional description, and is automatically recorded in the `ComponentRegistry` for lookup by external tools. This enables powerful integrations with build tools and external editors.

```typescript
import { ComponentRegistry } from 'elics';

// Components are automatically available for lookup
const positionComp = ComponentRegistry.getById('Position');
const healthComp = ComponentRegistry.getById('Health');

// List all recorded components
console.log(
	'Recorded components:',
	ComponentRegistry.getAllComponents().length,
);
```

Optionally register these components with the world for explicit control (or they will be automatically registered when first used):

```typescript
// Optional manual registration
world
	.registerComponent(Position)
	.registerComponent(Velocity)
	.registerComponent(Health)
	.registerComponent(Unit);
```

## Creating Entities

Instantiate entities and attach components:

```typescript
// Create different types of units with enum values
const infantryUnit = world.createEntity();
infantryUnit.addComponent(Position, { value: [10, 20, 30] });
infantryUnit.addComponent(Velocity);
infantryUnit.addComponent(Health);
infantryUnit.addComponent(Unit, {
	type: UnitType.Infantry,
	state: CombatState.Moving,
	damage: 15, // Valid: within 1-100 range
	armor: 20, // Valid: within 0-50 range
	morale: 0.8, // Valid: within 0.0-1.0 range
});

const archerUnit = world.createEntity();
archerUnit.addComponent(Position, { value: [50, 0, 100] });
archerUnit.addComponent(Health, { value: 80 });
archerUnit.addComponent(Unit, {
	type: UnitType.Archer,
	state: CombatState.Defending,
	damage: 25, // Valid: within 1-100 range
	armor: 5, // Valid: within 0-50 range
	morale: 0.9, // Valid: within 0.0-1.0 range
});
```

## Creating Systems

Systems contain the core logic.

```typescript
import { createSystem } from 'elics';

const queryConfig = {
	movables: { required: [Position, Velocity] },
	combatUnits: { required: [Unit, Health] },
};

class MovementSystem extends createSystem(queryConfig) {
	update(delta, time) {
		this.queries.movables.entities.forEach((entity) => {
			const position = entity.getVectorView(Position, 'value');
			const velocity = entity.getVectorView(Velocity, 'value');
			position[0] += velocity[0] * delta;
			position[1] += velocity[1] * delta;
			position[2] += velocity[2] * delta;
		});
	}
}

class CombatSystem extends createSystem(queryConfig) {
	update(delta, time) {
		this.queries.combatUnits.entities.forEach((entity) => {
			const unitState = entity.getValue(Unit, 'state');
			const unitType = entity.getValue(Unit, 'type');

			// Process units based on their state
			switch (unitState) {
				case CombatState.Attacking:
					this.handleAttack(entity, unitType);
					break;
				case CombatState.Defending:
					this.handleDefense(entity, unitType);
					break;
				case CombatState.Moving:
					// Units continue moving
					break;
			}
		});
	}

	handleAttack(entity, unitType) {
		const damage = entity.getValue(Unit, 'damage');
		// Different unit types have different attack behaviors
		if (unitType === UnitType.Archer) {
			// Ranged attack logic
			console.log(`Archer attacks with ${damage} damage`);
		} else if (unitType === UnitType.Infantry) {
			// Melee attack logic
			console.log(`Infantry attacks with ${damage} damage`);
		}

		// Change state back to idle after attacking
		entity.setValue(Unit, 'state', CombatState.Idle);
	}

	handleDefense(entity, unitType) {
		// Defense logic based on unit type
		console.log(
			`${unitType === UnitType.Archer ? 'Archer' : 'Infantry'} is defending`,
		);
	}
}

world.registerSystem(MovementSystem);
world.registerSystem(CombatSystem);
```

> Note on vector fields: Components that use `Types.Vec2`, `Types.Vec3`, or
> `Types.Vec4` must be accessed and mutated via `getVectorView(component, key)`.
> Do not use `getValue`/`setValue` for these fields—EliCS enforces this at
> runtime by throwing if you call those methods on vector data.

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

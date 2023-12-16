---
outline: deep
---

# Component Class

The `Component` class in EliCS is a fundamental part of the ECS (Entity-Component-System) architecture. Components are modular and reusable data containers that attach to entities, defining their characteristics and behaviors.

## Features

- **Modularity**: Designed to be reusable and interchangeable, components allow for flexible entity configuration.
- **Data Encapsulation**: Each component encapsulates data relevant to a specific aspect of an entity.

## Component Pooling

In EliCS, components are managed efficiently through a component pooling system, similar to entity pooling, ensuring optimized performance and resource utilization.

### How It Works

- **Component Attachment**: When a component is added to an entity, the system checks for available instances in the pool.
- **Reusing Components**: If there are reusable components in the pool, they are reactivated and attached to the entity, bypassing the need to create a new instance.
- **New Component Instances**: If no reusable instances are available, a new component instance is created.
- **Component Detachment**: When a component is removed from an entity, it is not immediately discarded. Instead, it is returned to the component pool for future reuse.

This approach significantly reduces the overhead associated with frequently adding and removing components from entities, which is particularly beneficial in applications with dynamic entity configurations.

## Usage

### Data Storage

In EliCS, components can be customized to store any type of data or functionality. Unlike traditional ECS implementations that enforce strict schemas, EliCS allows developers to define custom properties and methods within components. This flexibility speeds up development and allows for creative solutions.

#### Defining Custom Properties and Methods

Developers can add any properties or methods to their component classes. For example:

```ts
class HealthComponent extends Component {
	health: number;
	maxHealth: number;

	constructor() {
		super();
		this.health = 100;
		this.maxHealth = 100;
	}

	takeDamage(amount: number) {
		this.health -= amount;
	}
}
```

### Implementing the Reset Method

A critical requirement for components in EliCS is the implementation of a `reset` method. This method is called when the component instance is recycled, ensuring that the component's state is cleaned up properly.

```ts
class HealthComponent extends Component {
	// ... other properties and methods ...

	reset() {
		this.health = this.maxHealth;
	}
}
```

This method should reset the component to its initial state, ready for reuse without any lingering data from its previous usage.

### Creating and Attaching Components

Components are typically created and attached to entities using the `addComponent` method of the `Entity` class.

```ts
import { YourComponent } from 'your-components';

// Attaching a component to an entity
entity.addComponent(YourComponent, {
	/* initial data */
});
```

### Detaching Components

Components can be removed from entities using the `removeComponent` method.

```ts
// Removing a component from an entity
entity.removeComponent(YourComponent);
```

## Properties

### `bitmask`

A static property that acts as a unique identifier for each component type.

- **Type**: `ComponentMask`

### `defaults`

A static property that provides default values for new instances of the `Component` class. This property is designed to be overridden in derived classes to specify custom default values for each specific component type. When a new instance of `Component` or a derived class is created, the values in `defaults` are used to initialize the instance's properties, ensuring that all instances have a consistent set of default values.

- **Type**: `{ [key: string]: any }`

## Methods

### `reset`

A method used to reset the component to its initial state, typically called when the component is returned to the pool.

```ts
public reset(): void {
	// Implementation details
}
```

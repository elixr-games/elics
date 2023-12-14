---
outline: deep
---

# Entity Class

The `Entity` class in EliCS is a core component of the ECS architecture, representing individual objects or actors within your application. It serves as a container for multiple components, enabling dynamic interactions and behaviors.

## Features

- **Component Management**: Facilitates adding, accessing, and removing components to and from entities.
- **Lifecycle Handling**: Manages the entity's active state and provides functionality for its destruction.
- **Query Integration**: Integrates seamlessly with query mechanisms for effective entity processing.

## Entity Pooling

In EliCS, entities are managed efficiently through an entity pooling system handled by the `EntityManager`. This internal mechanism optimizes performance and resource utilization by reusing entity instances.

### How It Works

- **Entity Creation**: When a new entity is requested, the `EntityManager` first checks its pool of available entities.
- **Reusing Entities**: If the pool has available entities, it reactivates one and returns it, avoiding the overhead of creating a new instance.
- **New Entities**: If no entities are available in the pool, a new entity is created and provided.
- **Entity Destruction**: When an entity is destroyed, it's not immediately discarded. Instead, it's returned to the entity pool for future reuse.

This approach significantly reduces the performance cost associated with frequently creating and destroying entities, especially in applications with a high turnover of entities.

## Usage

### Creating an Entity

Entities are typically created via the `World` class:

```ts
import { World } from 'elics';

const world = new World();
const entity = world.createEntity();
```

### Managing Components

Adding and accessing components:

```ts
import { YourComponent } from 'your-components';

// Adding a component
entity.addComponent(YourComponent, {
	/* initial data */
});

// Accessing a component
const component = entity.getComponent(YourComponent);
```

### Destroying an Entity

```ts
entity.destroy();
```

## Properties

### `isActive`

Indicates whether the entity is currently active.

- **Type**: `boolean`
- **Readonly**

## Methods

### `addComponent`

Adds a component to the entity.

```ts
addComponent<T extends typeof Component>(
    componentClass: T,
    initialData?: { [key: string]: any }
): Component
```

- **componentClass**: `T` extends `typeof Component` - The class of the component to be added.
- **initialData**: `{ [key: string]: any }` (optional) - Initial data for the component.
- **Returns**: `Component` - The added component instance.

### `removeComponent`

Removes a specified component from the entity.

```ts
removeComponent<T extends typeof Component>(componentClass: T): void
```

- **componentClass**: `T` extends `typeof Component` - The class of the component to be removed.

### `hasComponent`

Checks if the entity has a specified component.

```ts
hasComponent<T extends typeof Component>(componentClass: T): boolean
```

- **componentClass**: `T` extends `typeof Component` - The class of the component to check.
- **Returns**: `boolean` - `true` if the entity has the component, otherwise `false`.

### `getComponent`

Retrieves a specific component from the entity.

```ts
getComponent<T extends Component>(componentClass: {
    new (_cm: ComponentManager, _mi: number): T;
    bitmask: ComponentMask;
}): T | null
```

- **componentClass**: `{ new (_cm: ComponentManager, _mi: number): T; bitmask: ComponentMask }` - The constructor of the component class.
- **Returns**: `T | null` - The instance of the component or `null` if not found.

### `getComponentTypes`

Lists all component types currently associated with the entity.

```ts
getComponentTypes(): (typeof Component)[]
```

- **Returns**: `(typeof Component)[]` - An array of component types.

### `destroy`

Destroys the entity, releasing all its components and removing it from the world.

```ts
destroy(): void
```

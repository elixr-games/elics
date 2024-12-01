---
outline: deep
---

# Entity Class

The `Entity` class in EliCS is a core component of the ECS architecture, representing individual objects or actors within your application. It serves as a container for multiple components, enabling dynamic interactions and behaviors.

## Features

- **Component Management**: Facilitates adding, accessing, and removing components to and from entities.
- **Lifecycle Handling**: Manages the entity's active state and provides functionality for its destruction.
- **Query Integration**: Integrates seamlessly with query mechanisms for effective entity processing.
- **Vector Views**: Provides optimized access to array-like data in components, reducing memory overhead for operations like reading vectors.

## Entity Pooling

Entities are managed efficiently through an entity pooling system handled by the `EntityManager`. This internal mechanism optimizes performance and resource utilization by reusing entity instances.

### How It Works

- **Entity Creation**: When a new entity is requested, the `EntityManager` first checks its pool of available entities.
- **Reusing Entities**: If the pool has available entities, it reactivates one and returns it, avoiding the overhead of creating a new instance.
- **New Entities**: If no entities are available in the pool, a new entity is created and provided.
- **Entity Destruction**: When an entity is destroyed, it's not immediately discarded. Instead, it's returned to the entity pool for future reuse.

This approach significantly reduces the performance cost associated with frequently creating and destroying entities, especially in applications with a high turnover of entities.

## Usage

### Creating an Entity

Entities are created via the `World` class:

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

// Accessing a component's value
const value = entity.getValue(YourComponent, 'key');

// Modifying a component's value
entity.setValue(YourComponent, 'key', newValue);
```

Accessing a vector view:

```ts
const vectorView = entity.getVectorView(YourComponent, 'vectorKey');

// Perform operations on the vector view
vectorView[0] = 42; // Example: Updating the first element
vectorView.set([1, 2, 3]); // Example: Setting the entire vector
vectorView.set(vector3.toArray()); // Example: Setting from Three.js Vector3
```

### Destroying an Entity

```ts
entity.destroy();
```

## Properties

### `active`

Indicates whether the entity is currently active.

- **Type**: `boolean`
- **Readonly**

## Methods

### `addComponent`

Adds a component to the entity.

```ts
addComponent(
	componentClass: ComponentConstructor,
	initialData?: { [key: string]: any }
): this
```

- **componentClass**: `ComponentConstructor` - The class of the component to be added.
- **initialData**: `{ [key: string]: any }` (optional) - Initial data for the component.
- **Returns**: `this` - The entity instance for chaining.

### `removeComponent`

Removes a specified component from the entity.

```ts
removeComponent(componentClass: ComponentConstructor): this
```

- **componentClass**: `ComponentConstructor` - The class of the component to be removed.
- **Returns**: `this` - The entity instance for chaining.

### `hasComponent`

Checks if the entity has a specified component.

```ts
hasComponent(componentClass: ComponentConstructor): boolean
```

- **componentClass**: `ComponentConstructor` - The class of the component to check.
- **Returns**: `boolean` - `true` if the entity has the component, otherwise `false`.

### `getValue`

Retrieves a value from a component associated with the entity.

```ts
getValue(componentClass: ComponentConstructor, key: string): any
```

- **componentClass**: `ComponentConstructor` - The class of the component.
- **key**: `string` - The key of the value to retrieve.
- **Returns**: `any` - The value associated with the key.

### `setValue`

Updates a value in a component associated with the entity.

```ts
setValue(componentClass: ComponentConstructor, key: string, value: any): void
```

- **componentClass**: `ComponentConstructor` - The class of the component.
- **key**: `string` - The key of the value to update.
- **value**: `any` - The new value to set.

### `getVectorView`

Provides a subarray view for vector-like component data.

```ts
getVectorView(componentClass: ComponentConstructor, key: string): TypedArray
```

- **componentClass**: `ComponentConstructor` - The class of the component.
- **key**: `string` - The key of the vector data.
- **Returns**: `TypedArray` - A subarray view for the vector data.

### `destroy`

Destroys the entity, releasing all its components and removing it from the world.

```ts
destroy(): void
```

### `getComponents`

Lists all components currently associated with the entity.

```ts
getComponents(): ComponentConstructor[]
```

- **Returns**: `ComponentConstructor[]` - An array of component constructors.

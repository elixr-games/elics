---
outline: deep
---

# Entity Class

The **Entity** class in EliCS is a core component of the ECS architecture, representing individual objects or actors within your application. It serves as a container for multiple components, enabling dynamic interactions and behaviors.

## Features

- **Component Management**: Facilitates adding, accessing, and removing components to and from entities.
- **Lifecycle Handling**: Manages the entity's active state and provides functionality for its destruction.
- **Query Integration**: Seamlessly integrates with query mechanisms for effective entity filtering and processing.
- **Vector Views**: Offers optimized access to array-like component data, enhancing performance when working with vector information.

## Implementation Overview

Under the hood, entities are managed through an efficient pooling mechanism implemented by the **EntityManager**. When a new entity is requested via the `World.createEntity()` method, the system first checks an internal pool to reuse an existing inactive entity, reducing the performance cost associated with frequent creation and destruction. When an entity is destroyed using the `destroy()` method, it is not immediately discarded but instead returned to the pool, ensuring minimal garbage collection overhead and improved runtime performance. Additionally, the use of BitSet masks for component management and cached vector views for component data access further optimizes entity operations.

## Usage

The following examples illustrate how to create, manage, and destroy entities within your ECS-powered application.

### Creating an Entity

Entities are created via the `World` class:

```ts
import { World } from 'elics';

const world = new World();
const entity = world.createEntity();
```

### Managing Components

Adding and accessing components is straightforward:

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

### Accessing a Vector View

Retrieve a subarray view for vector-like component data for optimized operations:

```ts
const vectorView = entity.getVectorView(YourComponent, 'vectorKey');

// Update the first element of the vector
vectorView[0] = 42;

// Set the entire vector from an array
vectorView.set([1, 2, 3]);

// Set the vector using data from a Three.js Vector3 (after converting to an array)
vectorView.set(vector3.toArray());
```

### Destroying an Entity

When an entity is no longer needed, destroy it to free up resources:

```ts
entity.destroy();
```

## API Documentation

This section documents the API of the **Entity** class, including its properties and methods.

### Constructor

**Note:**  
Entities should be created using the `World.createEntity()` method. The constructor is invoked internally by the **EntityManager**.

### Properties

- `active` (`boolean`):  
  Indicates whether the entity is currently active. This property is read-only and reflects the entity's lifecycle state.

### Methods

- `addComponent(componentClass: ComponentConstructor, initialData?: { [key: string]: any }): this`  
  Adds a component to the entity.

  - **Parameters:**
    - `componentClass`: The class of the component to be added.
    - `initialData` (optional): An object containing initial data for the component.
  - **Returns:** The entity instance for method chaining.

- `removeComponent(componentClass: ComponentConstructor): this`  
  Removes the specified component from the entity.

  - **Parameters:**
    - `componentClass`: The class of the component to remove.
  - **Returns:** The entity instance for method chaining.

- `hasComponent(componentClass: ComponentConstructor): boolean`  
  Checks if the entity has a specified component.

  - **Parameters:**
    - `componentClass`: The class of the component to check.
  - **Returns:** `true` if the component is present; otherwise, `false`.

- `getValue(componentClass: ComponentConstructor, key: string): any`  
  Retrieves a value from a component associated with the entity.

  - **Parameters:**
    - `componentClass`: The class of the component.
    - `key`: The key for the value to retrieve.
  - **Returns:** The value associated with the specified key.

- `setValue(componentClass: ComponentConstructor, key: string, value: any): void`  
  Updates a value in a component associated with the entity.

  - **Parameters:**
    - `componentClass`: The class of the component.
    - `key`: The key of the value to update.
    - `value`: The new value to set.
  - **Returns:** `void`.

- `getVectorView(componentClass: ComponentConstructor, key: string): TypedArray`  
  Provides a subarray view for vector-like component data.

  - **Parameters:**
    - `componentClass`: The class of the component.
    - `key`: The key associated with the vector data.
  - **Returns:** A `TypedArray` representing the subarray view.

- `destroy(): void`  
  Destroys the entity by releasing all its components and returning it to the pool.

  - **Returns:** `void`.

- `getComponents(): ComponentConstructor[]`  
  Retrieves a list of all component constructors currently associated with the entity.
  - **Returns:** An array of component constructors.

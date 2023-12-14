---
outline: deep
---

# Architecture Overview

ECS (Entity Component System) is a design pattern widely used in game development and complex application design, characterized by its flexibility, efficiency, and scalability. EliCS is an implementation of this pattern, offering a streamlined approach to managing entities, components, systems, and queries.

## Core Concepts

### [Entities](entity.md)

Entities are fundamental objects or actors within your application. They are essentially containers for components and do not possess any direct functionality or data.

### [Components](component.md)

Components are pure data containers that define the properties or behaviors of entities. They are modular and can be dynamically attached to or detached from entities.

### [Systems](system.md)

Systems contain the logic of your application. They operate on entities that have specific component configurations, defined through queries.

### [Queries](query.md)

Queries are used by systems to efficiently select entities based on their components. EliCS utilizes a bitmasking technique for fast query evaluation.

### [World](world.md)

The World is the central orchestrator in EliCS. It manages the lifecycle and interaction of entities, components, systems, and queries.

## Workflow

1. **Component Creation**: Define the various component types that represent the data needed in your application.

   - Example: Position, Velocity, Health, etc.

2. **Entity Construction**: Create entities and attach components to them, thereby defining their characteristics and capabilities.

3. **System Development**: Implement systems that process entities. These systems use queries to select entities based on their component composition.

4. **World Integration**: Register components, entities, and systems with the World. The World coordinates the execution and interaction of all these elements.

5. **Execution Cycle**: The World updates all systems in each frame or tick of your application's main loop. Systems then process their relevant entities.

## Key Advantages

- **Decoupling**: Separation of data (components) from logic (systems) facilitates a modular and scalable architecture.
- **Efficiency**: Bitmasking in queries and the pooling mechanism in entities and components ensure high performance, especially in scenarios with numerous entities and frequent changes.
- **Flexibility**: The dynamic nature of entities and components allows for runtime changes, suitable for complex and evolving application states.

## Conclusion

EliCS's approach to the ECS pattern streamlines the development of complex applications, providing a robust framework for efficiently managing entities, components, systems, and their interactions. This architecture not only enhances performance but also offers the flexibility needed in dynamic application environments.

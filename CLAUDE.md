# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

EliCS is a lightweight Entity Component System (ECS) framework optimized for complex 3D web applications. It provides high-performance archetype-based entity management with type-safe component schemas and reactive systems.

## Core Architecture

### Central Classes

- **World**: Main orchestrator managing entities, components, systems, and queries. Entry point for all ECS operations.
- **Entity**: Lightweight identifiers for game objects, managed by EntityManager with automatic pooling.
- **Component**: Data containers defined by typed schemas supporting primitives, vectors, objects, and enums.
- **System**: Logic processors that operate on entity queries with configurable priority and reactive configuration.
- **Query**: Filtered views of entities based on component requirements (all, any, none).

### Key Managers

- **EntityManager**: Handles entity lifecycle, component assignment, and automatic pooling
- **ComponentManager**: Manages component registration, storage arrays, and bitmask generation
- **QueryManager**: Maintains query results and automatically updates when entities change

### Type System

- Uses `DataType` enum for component field types: Int8, Int16, Float32, Float64, Boolean, String, Object, Vec2, Vec3, Vec4, Entity, Enum
- Component schemas are strongly typed with default values and validation (ranges for numbers, enum constraints)
- Systems use reactive configuration via `@preact/signals-core`

## Development Commands

### Building

```bash
npm run build          # Full build: clean, TypeScript compilation, and Rollup bundling
npm run build:ts       # TypeScript compilation only
npm run build:rollup   # Rollup bundling only (requires build:ts first)
npm run clean          # Remove lib/ and build/ directories
```

### Code Quality

```bash
npm run lint           # ESLint with auto-fix for src/, __tests__/, benchmarks/
npm run typecheck      # TypeScript type checking without compilation
npm run format         # Prettier formatting
```

### Testing

```bash
npm test               # Jest with coverage
npm test:watch         # Jest in watch mode
```

### Documentation

```bash
npm run docs:dev       # VitePress dev server
npm run docs:build     # Build documentation
npm run docs:preview   # Preview built docs
```

### Performance

```bash
npm run bench          # Run performance benchmarks against other ECS frameworks
npm run size-check     # Check bundle size
```

## Code Patterns

### Component Definition

```typescript
const PositionComponent = createComponent({
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
	z: { type: Types.Float32, default: 0 },
});
```

### System Implementation

Systems extend a base interface and define static `queries` and `config` properties. They receive dependency injection of World and QueryManager in constructor.

### Entity Operations

Entities are created via `world.createEntity()` and components are added/removed through the entity API. All operations automatically update relevant queries.

## File Organization

- `src/`: Core implementation files
- `__tests__/`: Jest test suites with comprehensive coverage
- `docs/`: VitePress documentation source
- `benchmarks/`: Performance comparison suite
- `lib/`: Compiled TypeScript output
- `build/`: Rollup bundled distributions

The codebase uses ES modules throughout with TypeScript strict mode enabled.

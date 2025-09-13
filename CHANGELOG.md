# Changelog

## [3.3.0] - "Prologue" - September 13, 2025

A polish release setting the stage for next week’s unveil. It adds a Color type, opt‑in replay for existing query matches, stricter typing, and consistent vector access semantics — all while keeping performance crisp and coverage at 100%.

### Added

- Color type: `Types.Color` (RGBA), stored as `Float32Array[4]`, defaulting to `[1, 1, 1, 1]`. Initialization clamps channels to `[0, 1]` and warns when clamping occurs (under checks).
- Query subscription replay: `Query.subscribe(event, callback, replayExisting?)` can now replay existing matches when subscribing to `'qualify'`.

### Changed

- Systems: `World.registerSystem` now accepts partial `configData` (you can provide only the keys you care about).
- Typing/lint: Tightened internal typings and banned explicit `any` in `src/`; enabled `curly` rule to require braces for control statements.

### Fixed

- Vector access correctness: `Entity.getValue`/`setValue` now throw for vector‑like fields (`Types.Vec2`, `Types.Vec3`, `Types.Vec4`, and `Types.Color`). Previously, these calls could lead to partial or incorrect reads/writes (e.g., only touching the first lane). Use `getVectorView(component, key)` to read/write packed vector data.

### Documentation

- Query docs updated with the new `subscribe` signature and behavior.
- Added a focused page on replaying existing subscriptions.
- Getting Started note updated to include `Types.Color` in vector access guidance.
- Entity docs now call out vector‑view requirements explicitly.

### Tests

- Maintained 100% coverage. Added tests for Color initialization (clamping + defaults), vector access enforcement, and `replayExisting` subscribe behavior.

### Migration

- Replace any direct `getValue`/`setValue` usage on vector fields with `getVectorView`:

  ```ts
  // Before
  // const v = e.getValue(Position, 'value'); // now throws
  // e.setValue(Position, 'value', [x, y, z]); // now throws

  // After
  const v = e.getVectorView(Position, 'value');
  v[0] += dx;
  v[1] += dy;
  v[2] += dz;
  ```

- If you want to initialize subscribers with entities that already match a query, pass `true` as the third arg:

  ```ts
  query.subscribe('qualify', onQualify, true);
  ```

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [3.2.0] - "Predicate Power" - August 13, 2025

A performance-focused release that scales component masks beyond 32 types, adds ergonomic and fast value predicates, and introduces a cross-engine micro-benchmark for value filtering.

### Added

- Multiword BitSet: Scalable bitmasks that support arbitrarily many component types (>32), with efficient operations (`set`, `clear`, `or/and/andNot`, `contains`, `intersects`, `toArray`).
- Value Predicates: Query `where` predicates for value-based filtering with operators `eq`, `ne`, `lt`, `le`, `gt`, `ge`, `in`, and `nin`.
- Typed Helper APIs: `eq`, `ne`, `lt`, `le`, `gt`, `ge`, `isin`, `nin` in `query-helpers` for type-safe, ergonomic predicate building.
- Benchmarks: New cross-engine "Value Filter (manual, all ops)" micro-benchmark across EliCS, Bitecs, Koota, Becsy, and Ecsy.
- Public API: Re-export predicate helpers from `index.ts` for first-class usage.

### Changed

- QueryManager: Added targeted value-change evaluation path (`updateEntityValue`) and `queriesByValueComponent` index to minimize re-evaluation scope.
- Entity: `setValue` now notifies QueryManager via the value-update path for precise predicate rechecks.

### Performance

- ≤32 component types: No regressions observed; performance parity maintained.
- 256 components: Strong results with multiword BitSet; cross-engine suite shows competitive scaling.
- Value filtering: In manual, per-entity filtering, EliCS leads or ties for fastest across engines in the new micro-benchmark.

### Tests

- Maintained 100% coverage. Added tests for multiword BitSet (>32 components), predicate correctness and validation, early-return branches in value update paths, and auto-registration of predicate components.

### Documentation

- Added Value Predicates section to the query architecture docs, demonstrating helper-based usage only, examples for all operators, and performance notes.
- Benchmarks page updated to include the new value-filter scenario and fresh results.
- Updated enum examples to string-based const assertions; fixed `types.md` details and aligned component docs and getting started where relevant.

### Migration

- No breaking API changes. Predicate usage is encouraged via helper APIs; direct construction of predicate objects is not required.

## [3.1.0] - "Modern Enums" - August 5, 2025

Modernizes enum handling to align with current TypeScript best practices, replacing numeric enums with string-based const assertions.

### Breaking Changes

- **String-Based Enums**: Enum types now store and return string values instead of numbers
- **Storage Change**: Enum components now use `Array<string>` instead of `Int8Array`/`Int16Array`
- **Enum Pattern**: Traditional TypeScript enums are replaced with const object pattern:

  ```ts
  // Before (v3.0.x)
  enum Status {
  	Active = 1,
  	Inactive = 2,
  }

  // After (v3.1.0)
  const Status = {
  	Active: 'active',
  	Inactive: 'inactive',
  } as const;
  ```

### Benefits

- **Cleaner JavaScript**: No compiled enum artifacts, just plain objects
- **Better Tree-Shaking**: Const objects are more optimization-friendly
- **Type Safety Maintained**: Full TypeScript type checking preserved
- **Modern Standards**: Aligns with current TypeScript best practices
- **Simpler Implementation**: No need for numeric range detection

### Migration Guide

1. Replace traditional enums with const objects using string values
2. Update enum component definitions to use the new pattern
3. Enum values returned by `getValue()` are now strings instead of numbers

### Internal Changes

- Updated `TypeValueToType` to return `string` for Enum types
- Modified validation to work with string enum values
- Removed numeric range detection for enum array allocation
- Updated all tests to use const object pattern

## [3.0.0] - "Adapter" - July 24, 2025

A major release focused on framework extensibility and external tool integration, introducing component metadata, registry system, and entity lifecycle customization.

### Added

- **Component Metadata System**: Components now require an `id` parameter and support optional `description` for better tooling integration
- **ComponentRegistry**: Global registry for component lookup by ID, enabling powerful external tool integration
- **Entity Release Callbacks**: Optional `entityReleaseCallback` in WorldOptions for custom cleanup logic when entities are destroyed
- **External Tool Integration**: Support for Unity, Blender, and custom editor integration through component metadata
- **Build-time Component Discovery**: Documentation for AST parsing approach to extract component definitions at build time

### Breaking Changes

- **createComponent Signature**: Now requires an `id` parameter as the first argument:

  ```ts
  // Before
  const Component = createComponent(schema);

  // After
  const Component = createComponent(
  	'ComponentId',
  	schema,
  	'Optional description',
  );
  ```

- **Component Interface**: All Component objects now include `id` and optional `description` fields
- **Automatic Component Registration**: Components are automatically recorded in ComponentRegistry when created

### Enhanced Features

- **Lazy Component Registration**: Components are automatically registered with World when first used with entities or queries
- **Improved TypeScript Support**: Enhanced typing for component metadata and registry operations
- **Framework Integration**: Better support for framework-level extensions and custom ECS implementations

### API Changes

- **ComponentRegistry Methods**: New static methods for component lookup and management:
  - `ComponentRegistry.record()` - Records components (called automatically)
  - `ComponentRegistry.getById()` - Retrieves components by ID
  - `ComponentRegistry.has()` - Checks component existence
  - `ComponentRegistry.getAllComponents()` - Lists all components
  - `ComponentRegistry.clear()` - Clears registry (testing only)

### Documentation

- **Comprehensive Component Registry Documentation**: Added detailed examples for external tool integration
- **Entity Lifecycle Documentation**: Added entityReleaseCallback usage examples and patterns
- **Build Tool Integration Guide**: Documentation for AST parsing and webpack/vite plugin development
- **Updated Getting Started Guide**: Revised all examples to use new createComponent signature

### Internal Improvements

- **Error Handling**: ComponentRegistry throws errors for duplicate component IDs instead of warnings
- **Release Workflow**: Simplified GitHub Actions workflow to only trigger from web interface
- **Test Coverage**: Comprehensive tests for all new features and breaking changes

### Migration Guide

To upgrade from v2.x to v3.0.0:

1. **Update createComponent calls** - Add unique ID as first parameter
2. **Optional: Use ComponentRegistry** - Leverage new lookup capabilities for tooling
3. **Optional: Add entityReleaseCallback** - Implement custom cleanup if needed

This release maintains full ECS performance while significantly expanding integration capabilities for complex applications and external tooling.

## [2.4.0] - "Enumerator" - July 11, 2025

A significant feature release that adds comprehensive enum support for type-safe component properties with automatic storage optimization.

### Added

- **Enum Type Support**: New `Types.Enum` for defining enumerated component properties with numeric constants
- **Automatic Storage Optimization**: Smart selection between Int8Array and Int16Array based on enum value ranges
- **Runtime Validation**: Validates enum values during setValue operations and component initialization when checks are enabled
- **TypeScript Integration**: Full TypeScript support with proper type inference for enum properties
- **Schema Validation**: Validates that enum fields include required `enum` property during component registration

### Performance Improvements

- **Switch Statement Optimization**: Converted if/else chains to switch statements for better performance in component and entity operations
- **Conditional Validation**: Enum validation logic only executes when `CHECKS_ON` is true, improving runtime performance
- **Early Validation**: Enum property existence is validated once during component initialization rather than on every operation

### Breaking Changes

- **Schema Interface**: `TypedSchema` now supports conditional field types - enum fields require an additional `enum` property

### Documentation

- **Comprehensive Enum Documentation**: Added detailed enum usage examples and API documentation
- **Updated Getting Started Guide**: Enhanced with enum examples showing type-safe state management
- **Component Documentation**: Added enum examples demonstrating storage optimization and validation

### Internal Improvements

- **Enhanced Error Messages**: Added specific error message for invalid enum values
- **Validation Functions**: New `assertValidEnumValue` function for consistent enum validation
- **Type Safety**: Improved TypeScript definitions for enum schema fields

## [2.3.0] - "Streamliner" - May 29, 2025

A focused release that streamlines the component API by removing lifecycle hooks in favor of a more flexible query subscription system.

### Breaking Changes

- **Removed component lifecycle hooks**: The `onAttach` and `onDetach` callbacks have been removed from the component API. Components are now pure data containers without built-in lifecycle management.
- **Migration required**: Applications using `onAttach`/`onDetach` must migrate to query subscriptions:

  ```ts
  // Before
  const Component = createComponent(schema, onAttach, onDetach);

  // After
  const Component = createComponent(schema);
  const query = world.queryManager.registerQuery({ required: [Component] });
  query.subscribe('qualify', onAttach);
  query.subscribe('disqualify', onDetach);
  ```

### Added

- **Query subscription for lifecycle tracking**: Use `query.subscribe('qualify'/'disqualify')` to track when components are added or removed from entities
- **Multiple lifecycle listeners**: The new system supports multiple subscribers for the same component events
- **Conditional lifecycle tracking**: Create queries that track combinations of components, not just individual ones

### Fixed

- Fixed missing `disqualify` callbacks when removing the last component from an entity

### Changed

- Simplified component API - components are now pure data structures
- Improved separation of concerns - lifecycle logic is decoupled from component definitions
- Enhanced flexibility - subscriptions can be dynamically added or removed at runtime

### Documentation

- Updated component documentation to reflect the removal of lifecycle hooks
- Added comprehensive examples of using query subscriptions for lifecycle tracking
- Enhanced query documentation with component lifecycle tracking patterns

## [2.2.0] - "Hyper Glide" - May 23, 2025

A major release focusing on performance optimizations and comprehensive project infrastructure improvements.

### Performance Improvements

- Major query system optimization with improved entity lifecycle management
- Enhanced BitSet operations for faster component lookups
- Optimized entity destruction and cleanup processes
- Refined QueryManager for better memory usage and query performance
- Overall performance boost across all ECS operations

### Benchmarking & Testing

- Added comprehensive benchmark suite comparing against ECSY, Becsy, BitECS, and Koota
- Implemented isolated benchmark runner for consistent results
- Added performance regression testing
- Enhanced test coverage with entity lifecycle and edge case scenarios
- Restructured benchmark results by test scenario

### Infrastructure & Developer Experience

- Complete open source project setup with modern tooling
- GitHub workflows for CI/CD, automated releases, and security scanning
- Pre-commit hooks with Husky and lint-staged for code quality
- CodeQL security analysis and Dependabot for dependency management
- Comprehensive documentation including CONTRIBUTING.md, SECURITY.md, and CHANGELOG.md
- GitHub issue and pull request templates
- Enhanced package.json with tree-shaking optimization and additional scripts

### Bug Fixes

- Fixed entity index overflow in entity references
- Corrected query manager cleanup procedures
- Fixed getValue invalid key check
- Resolved vector view clearing on component removal and entity destruction

### Documentation

- Updated architecture documentation with improved typing examples
- Added detailed benchmark documentation and results
- Enhanced getting started guide and API references
- Added performance best practices and optimization guidelines

## [2.1.1] - Patch Release May 12, 2025

### Changed

- Performance optimizations

## [2.1.0] - Previous Release

### Added

- Initial stable release features
- Complete ECS implementation
- TypeScript supportå
- Documentation site

### Changed

- Various performance improvements

### Fixed

- Bug fixes and stability improvements

## How to Update

When releasing a new version:

1. Update this file with the new version and changes
2. Commit the changes
3. Create a new git tag: `git tag v2.1.1`
4. Push the tag: `git push origin v2.1.1`
5. Create a GitHub release with the tag

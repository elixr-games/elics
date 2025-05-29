# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

## [2.2.0] - "Hyper Glide" - January 22, 2025

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

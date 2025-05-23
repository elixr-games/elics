# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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

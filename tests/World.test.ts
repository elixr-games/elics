import { Component } from '../src/Component';
import { Query } from '../src/Query';
import { World } from '../src/World';

// Mock component classes
class MockComponent extends Component {}
class AnotherComponent extends Component {}
class ExcludedComponent extends Component {} // Additional excluded component

describe('World', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
	});

	test('should register components and assign bitmasks', () => {
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);

		// Test if the components have been assigned unique bitmasks by the world
		expect(MockComponent.bitmask).toBeDefined();
		expect(AnotherComponent.bitmask).toBeDefined();
		expect(MockComponent.bitmask).not.toBe(AnotherComponent.bitmask);
	});

	test('should create entities correctly', () => {
		const entity = world.createEntity();
		expect(entity).toBeDefined();
	});

	test('should update entities correctly', () => {
		world.registerComponent(MockComponent);
		const entity = world.createEntity();
		entity.addComponent(MockComponent);

		const query = new Query([MockComponent]);
		const matchingEntities = world.getEntities(query);
		expect(matchingEntities).toContain(entity);
	});

	test('should get entities matching a query', () => {
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);

		const entityWithMock = world.createEntity();
		entityWithMock.addComponent(MockComponent);

		const entityWithBoth = world.createEntity();
		entityWithBoth.addComponent(MockComponent);
		entityWithBoth.addComponent(AnotherComponent);

		const query = new Query([MockComponent]);
		const matchingEntities = world.getEntities(query);

		expect(matchingEntities).toContain(entityWithMock);
		expect(matchingEntities).toContain(entityWithBoth);
	});

	test('should exclude entities with specific components in query', () => {
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);
		world.registerComponent(ExcludedComponent);

		const entityWithMock = world.createEntity();
		entityWithMock.addComponent(MockComponent);

		const entityWithMockAndExcluded = world.createEntity();
		entityWithMockAndExcluded.addComponent(MockComponent);
		entityWithMockAndExcluded.addComponent(ExcludedComponent);

		const query = new Query([MockComponent], [ExcludedComponent]);
		const matchingEntities = world.getEntities(query);

		expect(matchingEntities).toContain(entityWithMock);
		expect(matchingEntities).not.toContain(entityWithMockAndExcluded);
	});
});

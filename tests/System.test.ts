import { PRIVATE as WORLD_PRIVATE, World } from '../src/World';

import { Component } from '../src/Component';
import { EntityManager } from '../src/EntityManager';
import { QueryManager } from '../src/QueryManager';
import { System } from '../src/System';

class MockComponent extends Component {}

class AnotherComponent extends Component {}

class MockSystem extends System {
	updateCalled = false;

	init() {
		// Initialization logic
	}

	update(_delta: number, _time: number): void {
		this.updateCalled = true;
	}
}

describe('System', () => {
	let world: World;
	let system: MockSystem;
	let entityManager: EntityManager;
	let queryManager: QueryManager;

	beforeEach(() => {
		world = new World();
		entityManager = world[WORLD_PRIVATE].entityManager;
		queryManager = world[WORLD_PRIVATE].queryManager;
		system = new MockSystem(world, queryManager);
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);
	});

	test('should be initialized correctly', () => {
		expect(system.world).toBe(world);
		expect(system.updateCalled).toBeFalsy();
	});

	test('should handle play and stop correctly', () => {
		system.play();
		expect(system.isPaused).toBeFalsy();

		system.stop();
		expect(system.isPaused).toBeTruthy();
	});

	test('should get entities based on query', () => {
		const query = queryManager.registerQuery({ required: [MockComponent] });
		const entityWithMock = entityManager.requestEntityInstance();
		entityWithMock.addComponent(MockComponent);

		const entityWithBoth = entityManager.requestEntityInstance();
		entityWithBoth.addComponent(MockComponent);
		entityWithBoth.addComponent(AnotherComponent);

		const entities = system.getEntities(query);

		expect(entities).toContain(entityWithMock);
		expect(entities).toContain(entityWithBoth);
	});
});

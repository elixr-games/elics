import { Component, ComponentMask } from '../src/Component';

import { EntityPool } from '../src/EntityPool';
import { Query } from '../src/Query';
import { QueryManager } from '../src/QueryManager';
import { System } from '../src/System';
import { World } from '../src/World';

class MockComponent extends Component {
	static bitmask: ComponentMask = 1 << 0;
}

class AnotherComponent extends Component {
	static bitmask: ComponentMask = 1 << 1;
}

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
	let entityPool: EntityPool;
	let queryManager: QueryManager;

	beforeEach(() => {
		world = new World();
		entityPool = new EntityPool(world);
		queryManager = new QueryManager(entityPool);
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
		const entityWithMock = entityPool.getEntity();
		entityWithMock.addComponent(MockComponent);

		const entityWithBoth = entityPool.getEntity();
		entityWithBoth.addComponent(MockComponent);
		entityWithBoth.addComponent(AnotherComponent);

		const query = new Query([MockComponent]);
		system.registerQuery(query);
		const entities = system.getEntities(query);

		expect(entities).toContain(entityWithMock);
		expect(entities).toContain(entityWithBoth);
	});
});

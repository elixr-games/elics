import { Component, ComponentMask } from '../src/Component';

import { Entity } from '../src/Entity';
import { EntityPool } from '../src/EntityPool';
import { Query } from '../src/Query';
import { World } from '../src/World';

// Mock component class for testing
class MockComponent extends Component {
	static bitmask: ComponentMask = 1 << 0; // Example bitmask
}

describe('EntityPool', () => {
	let world: World;
	let entityPool: EntityPool;

	beforeEach(() => {
		world = new World();
		entityPool = new EntityPool(world);
	});

	test('should create new entity if pool is empty', () => {
		const entity = entityPool.getEntity();
		expect(entity).toBeInstanceOf(Entity);
		expect(entity.isActive).toBeTruthy();
	});

	test('should reuse entities from the pool', () => {
		const firstEntity = entityPool.getEntity();
		firstEntity.destroy(); // Return the entity to the pool

		const secondEntity = entityPool.getEntity();
		expect(secondEntity).toBe(firstEntity); // The same instance should be reused
	});

	test('should return entity to pool on destruction', () => {
		const entity = entityPool.getEntity();
		entity.destroy();

		const entityFromPool = entityPool.getEntity();
		expect(entityFromPool).toBe(entity); // The destroyed entity should be reused
	});

	test('should update entity index correctly', () => {
		world.registerComponent(MockComponent);
		const entity = entityPool.getEntity();
		entity.addComponent(MockComponent);

		const query = new Query([MockComponent]);
		const matchingEntities = entityPool.getEntities(query);

		expect(matchingEntities).toContain(entity);
	});

	test('should remove entity from index on return', () => {
		world.registerComponent(MockComponent);
		const entity = entityPool.getEntity();
		entity.addComponent(MockComponent);
		entity.destroy();

		const query = new Query([MockComponent]);
		const matchingEntities = entityPool.getEntities(query);

		expect(matchingEntities).not.toContain(entity);
	});
});

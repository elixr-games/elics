import { Component, ComponentMask } from '../src/Component';

import { Entity } from '../src/Entity';
import { EntityPool } from '../src/EntityPool';
import { Query } from '../src/Query';
import { QueryManager } from '../src/QueryManager';
import { World } from '../src/World';

// Mock component classes for testing
class MockComponent extends Component {
	static bitmask: ComponentMask = 1 << 0; // Example bitmask
}

class AnotherComponent extends Component {
	static bitmask: ComponentMask = 1 << 1; // Example bitmask
}

describe('QueryManager', () => {
	let entityPool: EntityPool;
	let queryManager: QueryManager;
	let world: World;

	beforeEach(() => {
		world = new World();

		// Setup EntityPool and QueryManager
		entityPool = new EntityPool(world);
		queryManager = new QueryManager(entityPool);
	});

	test('registerQuery should store the results of initial query', () => {
		const query = new Query([MockComponent]);

		const entity = new Entity(world, entityPool, queryManager);
		entity.addComponent(MockComponent);
		queryManager.registerQuery(query);

		entityPool.updateEntityIndex(entity);

		expect(queryManager.getEntities(query)).toContain(entity);
	});

	test('updateEntity should correctly update query results', () => {
		const entity = entityPool.getEntity(queryManager);
		entity.addComponent(MockComponent);
		entityPool.updateEntityIndex(entity);

		const query = new Query([MockComponent]);
		queryManager.registerQuery(query);
		queryManager.updateEntity(entity);

		expect(queryManager.getEntities(query)).toContain(entity);
	});

	test('getEntities should return correct entities for a query', () => {
		const queryWithMock = new Query([MockComponent]);
		const queryWithAnother = new Query([AnotherComponent]);

		queryManager.registerQuery(queryWithMock);
		queryManager.registerQuery(queryWithAnother);

		const entityWithMock = entityPool.getEntity(queryManager);
		entityWithMock.addComponent(MockComponent);
		entityPool.updateEntityIndex(entityWithMock);

		const entityWithAnother = entityPool.getEntity(queryManager);
		entityWithAnother.addComponent(AnotherComponent);
		entityPool.updateEntityIndex(entityWithAnother);

		queryManager.updateEntity(entityWithMock);
		queryManager.updateEntity(entityWithAnother);

		expect(queryManager.getEntities(queryWithMock)).toContain(entityWithMock);
		expect(queryManager.getEntities(queryWithAnother)).toContain(
			entityWithAnother,
		);
		expect(queryManager.getEntities(queryWithMock)).not.toContain(
			entityWithAnother,
		);
	});

	test('getEntities should throw an error for an unregistered query', () => {
		const unregisteredQuery = new Query([MockComponent]);

		expect(() => {
			queryManager.getEntities(unregisteredQuery);
		}).toThrow(`Query not registered: ${unregisteredQuery.queryId}`);
	});
});

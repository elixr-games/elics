import { Query, QueryConfig } from '../src/Query';
import { PRIVATE as WORLD_PRIVATE, World } from '../src/World';

import BitSet from 'bitset';
import { Component } from '../src/Component';
import { Entity } from '../src/Entity';
import { QueryManager } from '../src/QueryManager';

// Mock component classes
class MockComponent extends Component {
	bitmask = new BitSet().set(1, 1);
}

class AnotherComponent extends Component {
	bitmask = new BitSet().set(2, 1);
}

function createQuery(config: QueryConfig) {
	const { requiredMask, excludedMask, queryId } =
		Query.generateQueryInfo(config);
	return new Query(requiredMask, excludedMask, queryId);
}

describe('Query', () => {
	let world: World;
	let queryManager: QueryManager;
	let queryWithMock: Query;
	let queryWithBoth: Query;
	let queryWithExclusion: Query;

	beforeEach(() => {
		world = new World();
		queryManager = world[WORLD_PRIVATE].queryManager;
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);

		queryWithMock = queryManager.registerQuery({ required: [MockComponent] });
		queryWithBoth = queryManager.registerQuery({
			required: [MockComponent, AnotherComponent],
		});
		queryWithExclusion = queryManager.registerQuery({
			required: [MockComponent],
			excluded: [AnotherComponent],
		});
	});

	test('QueryManager should register and retrieve entities based on queries', () => {
		const entity = new Entity(world, 0);
		entity.addComponent(MockComponent);
		entity.addComponent(AnotherComponent);

		expect(
			world[WORLD_PRIVATE].queryManager.getEntities(queryWithMock),
		).toContain(entity);
		expect(queryManager.getEntities(queryWithBoth)).toContain(entity);
		expect(queryManager.getEntities(queryWithExclusion)).not.toContain(entity);
	});

	test('QueryManager should update entities correctly when components are added or removed', () => {
		const entity = new Entity(world, 0);
		entity.addComponent(MockComponent);

		// Initially, the entity should match queryWithMock
		expect(queryManager.getEntities(queryWithMock)).toContain(entity);

		// Add AnotherComponent, should now also match queryWithBoth
		entity.addComponent(AnotherComponent);
		expect(queryManager.getEntities(queryWithBoth)).toContain(entity);

		// Remove MockComponent, should no longer match queryWithMock
		entity.removeComponent(MockComponent);
		expect(queryManager.getEntities(queryWithMock)).not.toContain(entity);
	});

	test('QueryManager should handle unregistered queries', () => {
		const unregisteredQuery = createQuery({ required: [AnotherComponent] });
		expect(() => {
			queryManager.getEntities(unregisteredQuery);
		}).toThrow(`Query not registered: ${unregisteredQuery.queryId}`);
	});

	test('should correctly generate query identifiers', () => {
		const queryIdWithMock = queryWithMock.queryId;
		const queryIdWithBoth = queryWithBoth.queryId;
		const queryIdWithExclusion = queryWithExclusion.queryId;

		// Test if query IDs are unique and correctly formatted
		expect(queryIdWithMock).not.toBe(queryIdWithBoth);
		expect(queryIdWithExclusion).not.toBe(queryIdWithMock);
		expect(queryIdWithExclusion).not.toBe(queryIdWithBoth);

		// Check the format of the generated queryId
		expect(queryIdWithMock).toMatch(/required:\d+\|excluded:\d+/);
		expect(queryIdWithBoth).toMatch(/required:\d+\|excluded:\d+/);
		expect(queryIdWithExclusion).toMatch(/required:\d+\|excluded:\d+/);
	});
});

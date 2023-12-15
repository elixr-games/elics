import { Component, ComponentMask } from '../src/Component';

import { Entity } from '../src/Entity';
import { Query } from '../src/Query';
import { QueryManager } from '../src/QueryManager';
import { World } from '../src/World';

// Mock component classes
class MockComponent extends Component {
	static bitmask: ComponentMask = 1 << 0; // Example bitmask
}

class AnotherComponent extends Component {
	static bitmask: ComponentMask = 1 << 1; // Example bitmask
}

describe('Query', () => {
	let world: World;
	let queryManager: QueryManager;
	let queryWithMock: Query;
	let queryWithBoth: Query;
	let queryWithExclusion: Query;

	beforeEach(() => {
		world = new World();
		queryManager = new QueryManager();
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);

		queryWithMock = new Query({ required: [MockComponent] });
		queryWithBoth = new Query({ required: [MockComponent, AnotherComponent] });
		queryWithExclusion = new Query({
			required: [MockComponent],
			excluded: [AnotherComponent],
		});

		queryManager.registerQuery(queryWithMock);
		queryManager.registerQuery(queryWithBoth);
		queryManager.registerQuery(queryWithExclusion);
	});

	test('QueryManager should register and retrieve entities based on queries', () => {
		const entity = new Entity(world);
		entity.addComponent(MockComponent);
		entity.addComponent(AnotherComponent);

		queryManager.updateEntity(entity);

		expect(queryManager.getEntities(queryWithMock)).toContain(entity);
		expect(queryManager.getEntities(queryWithBoth)).toContain(entity);
		expect(queryManager.getEntities(queryWithExclusion)).not.toContain(entity);
	});

	test('QueryManager should update entities correctly when components are added or removed', () => {
		const entity = new Entity(world);
		entity.addComponent(MockComponent);

		// Initially, the entity should match queryWithMock
		queryManager.updateEntity(entity);
		expect(queryManager.getEntities(queryWithMock)).toContain(entity);

		// Add AnotherComponent, should now also match queryWithBoth
		entity.addComponent(AnotherComponent);
		queryManager.updateEntity(entity);
		expect(queryManager.getEntities(queryWithBoth)).toContain(entity);

		// Remove MockComponent, should no longer match queryWithMock
		entity.removeComponent(MockComponent);
		queryManager.updateEntity(entity);
		expect(queryManager.getEntities(queryWithMock)).not.toContain(entity);
	});

	test('QueryManager should handle unregistered queries', () => {
		const unregisteredQuery = new Query({ required: [AnotherComponent] });
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

	test('direct test of matchesQuery', () => {
		const directMatch = Query.matchesQuery('required:1|excluded:0', 1);
		expect(directMatch).toBeTruthy();
	});

	test('should correctly match query identifiers with component masks', () => {
		const mockMask = MockComponent.bitmask;
		const anotherMask = AnotherComponent.bitmask;
		const combinedMask = mockMask | anotherMask;

		// Test the static method matchesQuery
		expect(Query.matchesQuery(queryWithMock.queryId, mockMask)).toBeTruthy();
		expect(
			Query.matchesQuery(queryWithMock.queryId, combinedMask),
		).toBeTruthy();
		expect(
			Query.matchesQuery(queryWithBoth.queryId, combinedMask),
		).toBeTruthy();
		expect(Query.matchesQuery(queryWithBoth.queryId, mockMask)).toBeFalsy();
		expect(
			Query.matchesQuery(queryWithExclusion.queryId, mockMask),
		).toBeTruthy();
		expect(
			Query.matchesQuery(queryWithExclusion.queryId, combinedMask),
		).toBeFalsy();
	});

	test('matchesQuery should handle both zero and non-zero excluded masks', () => {
		const mockMask = MockComponent.bitmask;
		const anotherMask = AnotherComponent.bitmask;

		// Query with no excluded components (excluded mask is 0)
		const queryNoExclude = new Query({ required: [MockComponent] });
		expect(Query.matchesQuery(queryNoExclude.queryId, mockMask)).toBeTruthy();

		// Query with an excluded component (excluded mask is not 0)
		const queryWithExclude = new Query({
			required: [MockComponent],
			excluded: [AnotherComponent],
		});
		expect(Query.matchesQuery(queryWithExclude.queryId, mockMask)).toBeTruthy();
		expect(
			Query.matchesQuery(queryWithExclude.queryId, anotherMask),
		).toBeFalsy(); // Should fail as AnotherComponent is excluded
	});
});

import { Component, ComponentMask } from '../src/Component';

import { Query } from '../src/Query';
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
	let queryWithMock: Query;
	let queryWithBoth: Query;
	let queryWithExclusion: Query;

	beforeEach(() => {
		world = new World();
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);

		queryWithMock = new Query([MockComponent]);
		queryWithBoth = new Query([MockComponent, AnotherComponent]);
		queryWithExclusion = new Query([MockComponent], [AnotherComponent]);
	});

	test('should correctly identify matching component masks', () => {
		const mockMask = MockComponent.bitmask;
		const anotherMask = AnotherComponent.bitmask;
		const combinedMask = mockMask | anotherMask;

		expect(queryWithMock.matchesMask(mockMask)).toBeTruthy();
		expect(queryWithMock.matchesMask(combinedMask)).toBeTruthy();
		expect(queryWithBoth.matchesMask(combinedMask)).toBeTruthy();
		expect(queryWithBoth.matchesMask(mockMask)).toBeFalsy();
		expect(queryWithExclusion.matchesMask(mockMask)).toBeTruthy();
		expect(queryWithExclusion.matchesMask(combinedMask)).toBeFalsy();
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
		const queryNoExclude = new Query([MockComponent]);
		expect(Query.matchesQuery(queryNoExclude.queryId, mockMask)).toBeTruthy();

		// Query with an excluded component (excluded mask is not 0)
		const queryWithExclude = new Query([MockComponent], [AnotherComponent]);
		expect(Query.matchesQuery(queryWithExclude.queryId, mockMask)).toBeTruthy();
		expect(
			Query.matchesQuery(queryWithExclude.queryId, anotherMask),
		).toBeFalsy(); // Should fail as AnotherComponent is excluded
	});
});

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

	// Additional tests for different combinations and edge cases
});

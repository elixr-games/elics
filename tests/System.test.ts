import { System } from '../src/System';
import { World } from '../src/World';

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

	beforeEach(() => {
		world = new World();
		system = new MockSystem(world);
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
});

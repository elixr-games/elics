import { Component } from '../src/Component';
import { System } from '../src/System';
import { World } from '../src/World';

// Mock component classes
class MockComponent extends Component {}
class AnotherComponent extends Component {}

// Mock system classes with initCalled tracking
class MockSystem extends System {
	initCalled = false;
	updateCalled = false;

	init() {
		this.initCalled = true;
	}

	update(_delta: number, _time: number): void {
		if (!this.initCalled) {
			throw new Error('Init not called before update');
		}
		this.updateCalled = true;
	}
}

class AnotherSystem extends System {
	initCalled = false;
	updateCalled = false;

	init() {
		this.initCalled = true;
	}

	update(_delta: number, _time: number): void {
		if (!this.initCalled) {
			throw new Error('Init not called before update');
		}
		this.updateCalled = true;
	}
}

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

	test('should register, execute and unregister systems', () => {
		world.registerSystem(MockSystem);
		world.registerSystem(AnotherSystem);

		world.update(1, 1);
		const mockSystem = world.getSystem(MockSystem);
		const anotherSystem = world.getSystem(AnotherSystem);

		expect(mockSystem).toBeDefined();
		expect(anotherSystem).toBeDefined();

		expect(mockSystem!.updateCalled).toBeTruthy();
		expect(anotherSystem!.updateCalled).toBeTruthy();

		world.unregisterSystem(MockSystem);
		expect(world.getSystem(MockSystem)).toBeUndefined();
	});

	test('should maintain system execution order based on priority', () => {
		world.registerSystem(MockSystem); // Higher priority (lower number)
		world.registerSystem(AnotherSystem, 1);

		world.update(1, 1);
		const systems = world.getSystems();
		expect(systems[0]).toBeInstanceOf(MockSystem);
		expect(systems[1]).toBeInstanceOf(AnotherSystem);
	});

	test('should call init on system registration', () => {
		world.registerSystem(MockSystem);
		const mockSystem = world.getSystem(MockSystem);
		expect(mockSystem).toBeDefined();
		expect(mockSystem!.initCalled).toBeTruthy();
	});

	test('should call init before update on systems', () => {
		world.registerSystem(MockSystem);
		const mockSystem = world.getSystem(MockSystem);
		expect(mockSystem).toBeDefined();

		// The update method will throw an error if init is not called first
		expect(() => world.update(1, 1)).not.toThrow();
		expect(mockSystem!.updateCalled).toBeTruthy();
	});
});

import { Component, ComponentMask } from '../src/Component';

import { Entity } from '../src/Entity';
import { World } from '../src/World';

// Mock component classes
class MockComponent extends Component {
	static bitmask: ComponentMask = 1 << 0; // Example bitmask
}

class AnotherComponent extends Component {
	static bitmask: ComponentMask = 1 << 1; // Example bitmask
}

describe('Entity', () => {
	let world: World;
	let entity: Entity;

	beforeEach(() => {
		world = new World();
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);
		entity = new Entity(world);
	});

	test('should add components correctly', () => {
		entity.addComponent(MockComponent);
		expect(entity.hasComponent(MockComponent)).toBeTruthy();
		expect(entity.getComponent(MockComponent)).toBeInstanceOf(MockComponent);
	});

	test('should remove components correctly', () => {
		entity.addComponent(MockComponent);
		entity.removeComponent(MockComponent);
		expect(entity.hasComponent(MockComponent)).toBeFalsy();
		expect(entity.getComponent(MockComponent)).toBeNull();
	});

	test('should list component types correctly', () => {
		entity.addComponent(MockComponent);
		entity.addComponent(AnotherComponent);
		const componentTypes = entity.getComponentTypes();
		expect(componentTypes).toContain(MockComponent);
		expect(componentTypes).toContain(AnotherComponent);
		expect(componentTypes.length).toBe(2);
	});
});

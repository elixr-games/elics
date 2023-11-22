import { Component, ComponentMask } from '../src/Component';

import { Entity } from '../src/Entity';
import { EntityPool } from '../src/EntityPool';
import { Query } from '../src/Query';
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
	let entityPool: EntityPool;
	let entity: Entity;

	beforeEach(() => {
		world = new World();
		entityPool = new EntityPool(world);
		world.registerComponent(MockComponent);
		world.registerComponent(AnotherComponent);
		entity = entityPool.getEntity();
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

	test('should mark entity as inactive upon destruction', () => {
		entity.destroy();
		expect(entity.isActive).toBeFalsy();
	});

	test('should clear components upon destruction', () => {
		entity.addComponent(MockComponent);
		entity.destroy();

		expect(() => entity.getComponent(MockComponent)).toThrow();
		expect(() => entity.getComponentTypes()).toThrow();
	});

	test('should be removed from world upon destruction', () => {
		entity.addComponent(MockComponent);
		entity.destroy();

		const query = new Query([MockComponent]);
		const matchingEntities = entityPool.getEntities(query);
		expect(matchingEntities).not.toContain(entity);
	});
});

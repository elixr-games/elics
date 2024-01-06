import { Entity, EntityLike } from '../src/Entity';
import { PRIVATE as WORLD_PRIVATE, World } from '../src/World';

import { Component } from '../src/Component';
import { ComponentManager } from '../src/ComponentManager';
import { EntityManager } from '../src/EntityManager';

class MockComponent extends Component {
	static bitmask = 1;
}

describe('Entity and EntityManager', () => {
	let world: World;
	let entityManager: EntityManager;
	let entity: EntityLike;
	let componentManager: ComponentManager;

	beforeEach(() => {
		world = new World();
		entityManager = world[WORLD_PRIVATE].entityManager;
		componentManager = world[WORLD_PRIVATE].componentManager;
		entity = entityManager.requestEntityInstance();
		componentManager.registerComponent(MockComponent);
	});

	test('should create a new entity instance', () => {
		expect(entity).toBeInstanceOf(Entity);
		expect(entity.active).toBe(true);
	});

	test('should add and remove components', () => {
		entity.addComponent(MockComponent);
		expect(entity.hasComponent(MockComponent)).toBe(true);

		entity.removeComponent(MockComponent);
		expect(entity.hasComponent(MockComponent)).toBe(false);
	});

	test('should retrieve a component', () => {
		entity.addComponent(MockComponent);
		const component = entity.getComponent(MockComponent);
		expect(component).toBeInstanceOf(MockComponent);
	});

	test('should return null when getting a non-existent component', () => {
		const component = entity.getComponent(MockComponent);
		expect(component).toBeNull();
	});

	test('should destroy the entity', () => {
		entity.destroy();
		expect(entity.active).toBe(false);
	});

	test('should throw error when modifying a destroyed entity', () => {
		entity.destroy();
		expect(() => {
			entity.addComponent(MockComponent);
		}).toThrow();
	});

	test('EntityManager should reuse released entities', () => {
		const firstEntity = entityManager.requestEntityInstance();
		entityManager.releaseEntityInstance(firstEntity);
		const secondEntity = entityManager.requestEntityInstance();

		expect(secondEntity).toBe(firstEntity);
	});
});

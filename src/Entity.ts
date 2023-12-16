import { Component, ComponentMask } from './Component.js';
import { PRIVATE as WORLD_PRIVATE, World } from './World.js';

import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

export const PRIVATE = Symbol('@elics/entity');

const ERRORS = {
	MODIFY_DESTROYED_ENTITY: 'Cannot modify a destroyed entity',
	ACCESS_DESTROYED_ENTITY: 'Cannot access a destroyed entity',
};

export class Entity {
	[PRIVATE]: {
		componentMask: ComponentMask;
		components: Map<typeof Component, Component>;
		world: World;
		entityManager: EntityManager;
		queryManager: QueryManager;
		componentManager: ComponentManager;
		active: boolean;
	} = {
		componentMask: 0,
		components: new Map(),
		world: null as any,
		entityManager: null as any,
		queryManager: null as any,
		componentManager: null as any,
		active: true,
	};

	constructor(world: World) {
		this[PRIVATE].world = world;
		this[PRIVATE].entityManager = world[WORLD_PRIVATE].entityManager;
		this[PRIVATE].queryManager = world[WORLD_PRIVATE].queryManager;
		this[PRIVATE].componentManager = world[WORLD_PRIVATE].componentManager;
	}

	get isActive() {
		return this[PRIVATE].active;
	}

	addComponent<T extends typeof Component>(
		componentClass: T,
		initialData: { [key: string]: any } = {},
	) {
		if (!this[PRIVATE].active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		if (componentClass.bitmask !== null) {
			this[PRIVATE].componentMask |= componentClass.bitmask;
			const componentInstance = this[
				PRIVATE
			].componentManager.requestComponentInstance(componentClass, initialData);
			this[PRIVATE].components.set(componentClass, componentInstance);
			this[PRIVATE].queryManager.updateEntity(this);
			return componentInstance;
		} else {
			throw new Error('Component type not registered');
		}
	}

	removeComponent<T extends typeof Component>(componentClass: T): void {
		if (!this[PRIVATE].active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		if (
			componentClass.bitmask !== null &&
			this[PRIVATE].components.has(componentClass)
		) {
			const componentInstance = this[PRIVATE].components.get(componentClass);
			this[PRIVATE].componentManager.releaseComponentInstance(
				componentInstance!,
			);
			this[PRIVATE].componentMask &= ~componentClass.bitmask;
			this[PRIVATE].components.delete(componentClass);
			this[PRIVATE].queryManager.updateEntity(this);
		} else {
			throw new Error('Component not found');
		}
	}

	hasComponent<T extends typeof Component>(componentClass: T): boolean {
		if (!this[PRIVATE].active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return this[PRIVATE].components.has(componentClass);
	}

	getComponent<T extends Component>(componentClass: {
		new (_cm: ComponentManager, _mi: number): T;
		bitmask: ComponentMask;
		defaults: { [key: string]: any };
	}): T | null {
		if (!this[PRIVATE].active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		const component = this[PRIVATE].components.get(componentClass);
		if (!component) return null;
		return component as T;
	}

	getComponentTypes(): (typeof Component)[] {
		if (!this[PRIVATE].active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return Array.from(this[PRIVATE].components.keys());
	}

	destroy(): void {
		if (!this[PRIVATE].active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		this[PRIVATE].entityManager.releaseEntityInstance(this);
		// Mark the entity as inactive
		this[PRIVATE].active = false;

		// Clear the components map and reset the component mask
		this[PRIVATE].components.forEach((component) => {
			this[PRIVATE].componentManager.releaseComponentInstance(component);
		});
		this[PRIVATE].components.clear();
		this[PRIVATE].componentMask = 0;
		this[PRIVATE].queryManager.updateEntity(this);
	}
}

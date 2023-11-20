import { Component, ComponentMask } from './Component';

import { World } from './World';

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
		active: boolean;
	} = {
		componentMask: 0,
		components: new Map(),
		world: null as any,
		active: true,
	};

	constructor(world: World) {
		this[PRIVATE].world = world;
	}

	get isActive() {
		return this[PRIVATE].active;
	}

	addComponent<T extends typeof Component>(componentClass: T): void {
		if (!this[PRIVATE].active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		if (componentClass.bitmask !== null) {
			this[PRIVATE].componentMask |= componentClass.bitmask;
			const componentInstance = new componentClass();
			this[PRIVATE].components.set(componentClass, componentInstance);
			this[PRIVATE].world.updateEntity(this);
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
			this[PRIVATE].componentMask &= ~componentClass.bitmask;
			this[PRIVATE].components.delete(componentClass);
			this[PRIVATE].world.updateEntity(this);
		} else {
			throw new Error('Component not found');
		}
	}

	hasComponent<T extends typeof Component>(componentClass: T): boolean {
		if (!this[PRIVATE].active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		if (componentClass.bitmask === null) {
			return false;
		}
		return (this[PRIVATE].componentMask & componentClass.bitmask) !== 0;
	}

	getComponent<T extends Component>(componentClass: {
		new (): T;
		bitmask: ComponentMask;
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
		this[PRIVATE].world.removeEntity(this);
		// Mark the entity as inactive
		this[PRIVATE].active = false;

		// Clear the components map and reset the component mask
		this[PRIVATE].components.clear();
		this[PRIVATE].componentMask = 0;
	}
}

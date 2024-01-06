import { Component, ComponentMask } from './Component.js';
import { PRIVATE as WORLD_PRIVATE, World } from './World.js';

import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

const ERRORS = {
	MODIFY_DESTROYED_ENTITY: 'Cannot modify a destroyed entity',
	ACCESS_DESTROYED_ENTITY: 'Cannot access a destroyed entity',
};

export interface EntityLike {
	componentMask: ComponentMask;
	active: boolean;

	addComponent<T extends typeof Component>(
		componentClass: T,
		initialData?: { [key: string]: any },
	): Component | null;

	removeComponent<T extends typeof Component>(componentClass: T): void;

	hasComponent<T extends typeof Component>(componentClass: T): boolean;

	getComponent<T extends Component>(componentClass: {
		new (_cm: ComponentManager, _mi: number): T;
		bitmask: ComponentMask;
		defaults: { [key: string]: any };
	}): T | null;

	getComponentTypes(): (typeof Component)[];

	destroy(): void;
}

export class Entity implements EntityLike {
	public componentMask: ComponentMask = 0;
	public active = true;

	protected components: Map<typeof Component, Component> = new Map();
	protected entityManager: EntityManager;
	protected queryManager: QueryManager;
	protected componentManager: ComponentManager;

	constructor(world: World) {
		this.entityManager = world[WORLD_PRIVATE].entityManager;
		this.queryManager = world[WORLD_PRIVATE].queryManager;
		this.componentManager = world[WORLD_PRIVATE].componentManager;
	}

	addComponent<T extends typeof Component>(
		componentClass: T,
		initialData: { [key: string]: any } = {},
	) {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		if (componentClass.bitmask !== null) {
			this.componentMask |= componentClass.bitmask;
			const componentInstance = this.componentManager.requestComponentInstance(
				componentClass,
				initialData,
			);
			this.components.set(componentClass, componentInstance);
			this.queryManager.updateEntity(this);
			return componentInstance;
		} else {
			throw new Error('Component type not registered');
		}
	}

	removeComponent<T extends typeof Component>(componentClass: T): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		if (
			componentClass.bitmask !== null &&
			this.components.has(componentClass)
		) {
			const componentInstance = this.components.get(componentClass);
			this.componentManager.releaseComponentInstance(componentInstance!);
			this.componentMask &= ~componentClass.bitmask;
			this.components.delete(componentClass);
			this.queryManager.updateEntity(this);
		} else {
			throw new Error('Component not found');
		}
	}

	hasComponent<T extends typeof Component>(componentClass: T): boolean {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return this.components.has(componentClass);
	}

	getComponent<T extends Component>(componentClass: {
		new (_cm: ComponentManager, _mi: number): T;
		bitmask: ComponentMask;
		defaults: { [key: string]: any };
	}): T | null {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		const component = this.components.get(componentClass);
		if (!component) return null;
		return component as T;
	}

	getComponentTypes(): (typeof Component)[] {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return Array.from(this.components.keys());
	}

	destroy(): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		this.entityManager.releaseEntityInstance(this);
		// Mark the entity as inactive
		this.active = false;

		// Clear the components map and reset the component mask
		this.components.forEach((component) => {
			this.componentManager.releaseComponentInstance(component);
		});
		this.components.clear();
		this.componentMask = 0;
		this.queryManager.updateEntity(this);
	}
}

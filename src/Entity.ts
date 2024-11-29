import { Component, ComponentConstructor, ComponentMask } from './Component.js';
import { PRIVATE as WORLD_PRIVATE, World } from './World.js';

import BitSet from 'bitset';
import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

const ERRORS = {
	MODIFY_DESTROYED_ENTITY: 'Cannot modify a destroyed entity',
	ACCESS_DESTROYED_ENTITY: 'Cannot access a destroyed entity',
};

export interface EntityLike {
	bitmask: ComponentMask;
	active: boolean;
	get index(): number;

	addComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
		initialData?: { [key: string]: any },
	): T;

	removeComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): void;

	hasComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): boolean;

	getComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): T | null;

	getComponentTypes(): ComponentConstructor<Component>[];

	destroy(): void;
}

export const PRIVATE = Symbol('@elics/entity');

export class Entity {
	public bitmask: ComponentMask = new BitSet();
	public active = true;

	protected components: Map<ComponentConstructor<Component>, Component> =
		new Map();
	protected entityManager: EntityManager;
	protected queryManager: QueryManager;
	protected componentManager: ComponentManager;

	[PRIVATE]: {
		index: number;
	};

	constructor(world: World, index: number) {
		this.entityManager = world[WORLD_PRIVATE].entityManager;
		this.queryManager = world[WORLD_PRIVATE].queryManager;
		this.componentManager = world[WORLD_PRIVATE].componentManager;
		this[PRIVATE] = { index };
	}

	get index(): number {
		return this[PRIVATE].index;
	}

	addComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
		initialData: { [key: string]: any } = {},
	): T {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);

		if (componentClass.bitmask !== null) {
			this.bitmask = this.bitmask.or(componentClass.bitmask);
			const componentInstance = this.componentManager.requestComponentInstance(
				componentClass,
				initialData,
			);
			this.components.set(componentClass, componentInstance);
			this.queryManager.updateEntity(this);
			return componentInstance as T;
		} else {
			throw new Error('Component type not registered');
		}
	}

	removeComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);

		if (
			componentClass.bitmask !== null &&
			this.components.has(componentClass)
		) {
			const componentInstance = this.components.get(componentClass);
			this.componentManager.releaseComponentInstance(componentInstance!);
			this.bitmask = this.bitmask.andNot(componentClass.bitmask);
			this.components.delete(componentClass);
			this.queryManager.updateEntity(this);
		} else {
			throw new Error('Component not found');
		}
	}

	hasComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): boolean {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return this.components.has(componentClass);
	}

	getComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): T | null {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);

		const component = this.components.get(componentClass);
		if (!component) return null;

		// The cast here ensures the correct return type based on the input class.
		return component as T;
	}

	getComponentTypes(): ComponentConstructor<Component>[] {
		if (!this.active) throw new Error(ERRORS.ACCESS_DESTROYED_ENTITY);
		return Array.from(this.components.keys());
	}

	destroy(): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		this.entityManager.releaseEntityInstance(this);
		this.active = false;

		this.components.forEach((component) => {
			this.componentManager.releaseComponentInstance(component);
		});
		this.components.clear();
		this.bitmask = new BitSet();
		this.queryManager.updateEntity(this);
	}
}

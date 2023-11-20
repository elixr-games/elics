import { Component, ComponentMask } from './Component';

import { World } from './World';

export const PRIVATE = Symbol('@elics/entity');

export class Entity {
	[PRIVATE]: {
		componentMask: ComponentMask;
		components: Map<typeof Component, Component>;
		world: World;
	} = {
		componentMask: 0,
		components: new Map(),
		world: null as any,
	};

	constructor(world: World) {
		this[PRIVATE].world = world;
	}

	addComponent<T extends typeof Component>(componentClass: T): void {
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
		if (componentClass.bitmask === null) {
			return false;
		}
		return (this[PRIVATE].componentMask & componentClass.bitmask) !== 0;
	}

	getComponent<T extends Component>(componentClass: {
		new (): T;
		bitmask: ComponentMask;
	}): T | null {
		const component = this[PRIVATE].components.get(componentClass);
		if (!component) return null;
		return component as T;
	}

	getComponentTypes(): (typeof Component)[] {
		return Array.from(this[PRIVATE].components.keys());
	}
}

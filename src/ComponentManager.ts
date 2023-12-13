import { PRIVATE as COMPONENT_PRIVATE, Component } from './Component';

export const PRIVATE = Symbol('@elics/component-manager');

export class ComponentManager {
	[PRIVATE]: {
		componentPools: Map<number, Component[]>;
		freeInstances: Map<number, number[]>;
	} = {
		componentPools: new Map(),
		freeInstances: new Map(),
	};

	registerComponent(ComponentClass: typeof Component): void {
		this[PRIVATE].componentPools.set(ComponentClass.bitmask!, []);
		this[PRIVATE].freeInstances.set(ComponentClass.bitmask!, []);
	}

	requestComponentInstance(
		ComponentClass: typeof Component,
		initialData: { [key: string]: any } = {},
	): Component {
		const pool = this[PRIVATE].componentPools.get(ComponentClass.bitmask!);
		const free = this[PRIVATE].freeInstances.get(ComponentClass.bitmask!);

		if (!pool || !free) {
			throw new Error('Component class not registered');
		}

		// If there are free instances, use one
		if (free.length > 0) {
			const index = free.pop()!;
			const instance = pool[index];
			Object.assign(instance, initialData);
			return instance;
		} else {
			const newInstance = new ComponentClass(this, pool.length, initialData);
			pool.push(newInstance);
			return newInstance;
		}
	}

	releaseComponentInstance(componentInstance: Component): void {
		const ComponentClass = componentInstance.constructor as typeof Component;
		const pool = this[PRIVATE].componentPools.get(ComponentClass.bitmask!);
		const free = this[PRIVATE].freeInstances.get(ComponentClass.bitmask!);

		if (!pool || !free) {
			throw new Error('Component class not registered');
		}

		// Reset the component
		componentInstance.reset();

		// Add the index back to the free queue
		free.push(componentInstance[COMPONENT_PRIVATE].index);
	}
}

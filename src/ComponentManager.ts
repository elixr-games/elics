import {
	PRIVATE as COMPONENT_PRIVATE,
	Component,
	ComponentConstructor,
} from './Component.js';

import BitSet from 'bitset';

export const PRIVATE = Symbol('@elics/component-manager');

export class ComponentManager<T extends Component = Component> {
	[PRIVATE]: {
		componentPools: Map<ComponentConstructor<T>, Component[]>;
		freeInstances: Map<ComponentConstructor<T>, number[]>;
		nextComponentTypeId: number;
	} = {
		nextComponentTypeId: 0,
		componentPools: new Map(),
		freeInstances: new Map(),
	};

	registerComponent(componentClass: ComponentConstructor<T>): void {
		const typeId = this[PRIVATE].nextComponentTypeId++;
		componentClass.bitmask = new BitSet();
		componentClass.bitmask.set(typeId, 1);
		componentClass.initializeStorage();
		this[PRIVATE].componentPools.set(componentClass, []);
		this[PRIVATE].freeInstances.set(componentClass, []);
	}

	requestComponentInstance(
		componentClass: ComponentConstructor<T>,
		initialData: { [key: string]: any } = {},
	): Component {
		const pool = this[PRIVATE].componentPools.get(componentClass);
		const free = this[PRIVATE].freeInstances.get(componentClass);

		if (!pool || !free) {
			throw new Error('Component class not registered');
		}

		// If there are free instances, use one
		let instance;
		if (free.length > 0) {
			const index = free.pop()!;
			instance = pool[index];
		} else {
			instance = new componentClass(this, pool.length, initialData);
			pool.push(instance);
		}
		instance[COMPONENT_PRIVATE].assignInitialData(initialData);
		return instance;
	}

	releaseComponentInstance(componentInstance: Component): void {
		const ComponentClass =
			componentInstance.constructor as ComponentConstructor<any>;
		const pool = this[PRIVATE].componentPools.get(ComponentClass);
		const free = this[PRIVATE].freeInstances.get(ComponentClass);

		if (!pool || !free) {
			throw new Error('Component class not registered');
		}

		// Reset the component
		componentInstance.reset();

		// Add the index back to the free queue
		free.push(componentInstance.index);
	}
}

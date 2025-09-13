import {
	assignInitialComponentData,
	initializeComponentStorage,
} from './component.js';

import type { AnyComponent } from './types.js';
import BitSet from './bit-set.js';

export class ComponentManager {
	private nextComponentTypeId = 0;

	private componentsByTypeId: AnyComponent[] = [];

	constructor(private entityCapacity: number) {}

	hasComponent(component: AnyComponent): boolean {
		return (
			component.typeId !== -1 &&
			this.componentsByTypeId[component.typeId] === component
		);
	}

	registerComponent(component: AnyComponent): void {
		if (this.hasComponent(component)) {
			return;
		}
		const typeId = this.nextComponentTypeId++;
		component.bitmask = new BitSet();
		component.bitmask.set(typeId, 1);
		component.typeId = typeId;
		initializeComponentStorage(component, this.entityCapacity);
		this.componentsByTypeId[typeId] = component;
	}

	attachComponentToEntity(
		entityIndex: number,
		component: AnyComponent,
		initialData: Record<string, unknown>,
	): void {
		assignInitialComponentData(component, entityIndex, initialData);
	}

	getComponentByTypeId(typeId: number): AnyComponent | null {
		return this.componentsByTypeId[typeId] ?? null;
	}
}

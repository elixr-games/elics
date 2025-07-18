import BitSet from './bit-set.js';
import {
	type Component,
	assignInitialComponentData,
	initializeComponentStorage,
} from './component.js';

export class ComponentManager {
	private nextComponentTypeId = 0;

	private componentsByTypeId: Component<any>[] = [];

	constructor(private entityCapacity: number) {}

	hasComponent(component: Component<any>): boolean {
		return (
			component.typeId !== -1 &&
			this.componentsByTypeId[component.typeId] === component
		);
	}

	registerComponent(component: Component<any>): void {
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
		component: Component<any>,
		initialData: { [key: string]: any },
	): void {
		assignInitialComponentData(component, entityIndex, initialData);
	}

	getComponentByTypeId(typeId: number): Component<any> | undefined {
		return this.componentsByTypeId[typeId];
	}
}

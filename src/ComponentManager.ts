import BitSet from './BitSet.js';
import {
	assignInitialComponentData,
	initializeComponentStorage,
	type Component,
} from './Component.js';

export class ComponentManager {
	private nextComponentTypeId = 0;
	private componentsByTypeId: Component<any>[] = [];

	constructor(private entityCapacity: number) {}

	registerComponent(component: Component<any>): void {
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

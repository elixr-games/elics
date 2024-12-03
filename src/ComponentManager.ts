import BitSet from 'bitset';
import type { ComponentConstructor } from './Component.js';

export class ComponentManager {
	private nextComponentTypeId = 0;
	private componentsByTypeId: ComponentConstructor[] = [];

	constructor(private entityCapacity: number) {}

	registerComponent(componentClass: ComponentConstructor): void {
		const typeId = this.nextComponentTypeId++;
		componentClass.bitmask = new BitSet();
		componentClass.bitmask.set(typeId, 1);
		componentClass.typeId = typeId;
		componentClass.initializeStorage(this.entityCapacity);
		this.componentsByTypeId[typeId] = componentClass;
	}

	attachComponentToEntity(
		entityIndex: number,
		componentClass: ComponentConstructor,
		initialData: { [key: string]: any },
	): void {
		componentClass.assignInitialData(entityIndex, initialData);
	}

	getComponentByTypeId(typeId: number): ComponentConstructor | undefined {
		return this.componentsByTypeId[typeId];
	}
}

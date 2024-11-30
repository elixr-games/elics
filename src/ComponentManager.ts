import BitSet from 'bitset';
import type { ComponentConstructor } from './Component.js';

export const PRIVATE = Symbol('@elics/component-manager');

export class ComponentManager {
	private nextComponentTypeId = 0;

	constructor(private entityCapacity: number) {}

	registerComponent(componentClass: ComponentConstructor): void {
		const typeId = this.nextComponentTypeId++;
		componentClass.bitmask = new BitSet();
		componentClass.bitmask.set(typeId, 1);
		componentClass.initializeStorage(this.entityCapacity);
	}

	attachComponentToEntity(
		entityIndex: number,
		componentClass: ComponentConstructor,
		initialData: { [key: string]: any } = {},
	): void {
		componentClass.assignInitialData(entityIndex, initialData);
	}
}

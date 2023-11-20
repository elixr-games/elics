import { Component, ComponentMask } from './Component';
import { PRIVATE as ENTITY_MASK, Entity } from './Entity';

import { Query } from './Query';

enum ComponentType {}

export const PRIVATE = Symbol('@elics/world');

export class World {
	[PRIVATE]: {
		entities: Entity[];
		entityIndex: Map<ComponentMask, Set<Entity>>;
		componentTypes: Map<typeof Component, ComponentType>;
		nextComponentTypeId: number;
	} = {
		entities: [],
		entityIndex: new Map(),
		componentTypes: new Map(),
		nextComponentTypeId: 0,
	};

	registerComponent<T extends typeof Component>(componentClass: T): void {
		const typeId = 1 << this[PRIVATE].nextComponentTypeId;
		this[PRIVATE].nextComponentTypeId++;

		if (this[PRIVATE].nextComponentTypeId >= 32) {
			throw new Error('Exceeded the maximum number of unique components');
		}

		componentClass.bitmask = typeId;
		this[PRIVATE].componentTypes.set(componentClass, typeId);
	}

	// Updated methods to manage the entity index
	private updateEntityIndex(entity: Entity): void {
		const mask = entity[ENTITY_MASK].componentMask;
		if (!this[PRIVATE].entityIndex.has(mask)) {
			this[PRIVATE].entityIndex.set(mask, new Set());
		}
		this[PRIVATE].entityIndex.get(mask)!.add(entity);
	}

	createEntity(): Entity {
		const entity = new Entity(this);
		this[PRIVATE].entities.push(entity);
		this.updateEntityIndex(entity);
		return entity;
	}

	// Call this method whenever an entity's components change
	updateEntity(entity: Entity): void {
		// Remove from old mask set
		this[PRIVATE].entityIndex.forEach((entities, _mask) => {
			entities.delete(entity);
		});

		// Add to new mask set
		this.updateEntityIndex(entity);
	}

	getEntities(query: Query): Entity[] {
		let matchingEntities: Entity[] = [];
		this[PRIVATE].entityIndex.forEach((entities, mask) => {
			if (query.matchesMask(mask)) {
				matchingEntities.push(...entities);
			}
		});
		return matchingEntities;
	}
}

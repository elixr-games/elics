import { Component, ComponentMask } from './Component';
import { PRIVATE as ENTITY_PRIVATE, Entity } from './Entity';
import { PRIVATE as SYSTEM_PRIVATE, System } from './System';

import { Query } from './Query';

enum ComponentType {}

export const PRIVATE = Symbol('@elics/world');

export class World {
	[PRIVATE]: {
		entities: Set<Entity>;
		entityIndex: Map<ComponentMask, Set<Entity>>;
		componentTypes: Map<typeof Component, ComponentType>;
		nextComponentTypeId: number;
		systems: System[];
	} = {
		entities: new Set(),
		entityIndex: new Map(),
		componentTypes: new Map(),
		nextComponentTypeId: 0,
		systems: [],
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
		const mask = entity[ENTITY_PRIVATE].componentMask;
		if (!this[PRIVATE].entityIndex.has(mask)) {
			this[PRIVATE].entityIndex.set(mask, new Set());
		}
		this[PRIVATE].entityIndex.get(mask)!.add(entity);
	}

	createEntity(): Entity {
		const entity = new Entity(this);
		this[PRIVATE].entities.add(entity);
		this.updateEntityIndex(entity);
		return entity;
	}

	removeEntity(entity: Entity): void {
		// call this method before an entity is destroyed
		const mask = entity[ENTITY_PRIVATE].componentMask;
		this[PRIVATE].entityIndex.get(mask)?.delete(entity);
		this[PRIVATE].entities.delete(entity);
	}

	// Call this method whenever an entity's components change
	updateEntity(entity: Entity): void {
		if (entity.isActive) {
			// Remove from old mask set
			this[PRIVATE].entityIndex.forEach((entities, _mask) => {
				entities.delete(entity);
			});

			// Add to new mask set
			this.updateEntityIndex(entity);
		}
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

	registerSystem(
		systemClass: new (world: World, priority?: number) => System,
		priority?: number,
	): void {
		if (this[PRIVATE].systems.some((system) => system instanceof systemClass)) {
			throw new Error('System already registered');
		}

		const systemInstance = new systemClass(this, priority);
		systemInstance.init();

		// Determine the correct position for the new system based on priority
		const insertIndex = this[PRIVATE].systems.findIndex(
			(s) =>
				s[SYSTEM_PRIVATE].priority > systemInstance[SYSTEM_PRIVATE].priority,
		);

		if (insertIndex === -1) {
			this[PRIVATE].systems.push(systemInstance);
		} else {
			this[PRIVATE].systems.splice(insertIndex, 0, systemInstance);
		}
	}

	unregisterSystem(systemClass: typeof System): void {
		this[PRIVATE].systems = this[PRIVATE].systems.filter(
			(system) => !(system instanceof systemClass),
		);
	}

	update(delta: number, time: number): void {
		this[PRIVATE].systems.forEach((system) => {
			if (!system[SYSTEM_PRIVATE].isPaused) {
				system.update(delta, time);
			}
		});
	}

	getSystem<T extends System>(
		systemClass: new (...args: any[]) => T,
	): T | undefined {
		for (const system of this[PRIVATE].systems) {
			if (system instanceof systemClass) {
				return system as T;
			}
		}
		return undefined;
	}

	getSystems(): System[] {
		return [...this[PRIVATE].systems];
	}
}

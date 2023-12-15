import { PRIVATE as SYSTEM_PRIVATE, System } from './System';

import { Component } from './Component';
import { ComponentManager } from './ComponentManager';
import { Entity } from './Entity';
import { EntityManager } from './EntityManager';
import { Query } from './Query';
import { QueryManager } from './QueryManager';

export const PRIVATE = Symbol('@elics/world');

export class World {
	[PRIVATE]: {
		entityManager: EntityManager;
		queryManager: QueryManager;
		componentManager: ComponentManager;
		nextComponentTypeId: number;
		systems: System[];
	} = {
		entityManager: new EntityManager(this),
		queryManager: new QueryManager(),
		componentManager: new ComponentManager(),
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

		this[PRIVATE].componentManager.registerComponent(componentClass);
	}

	createEntity(): Entity {
		return this[PRIVATE].entityManager.requestEntityInstance();
	}

	registerSystem(systemClass: typeof System, priority?: number): void {
		if (this[PRIVATE].systems.some((system) => system instanceof systemClass)) {
			throw new Error('System already registered');
		}

		const systemInstance = new systemClass(
			this,
			this[PRIVATE].queryManager,
			priority,
		);

		Object.entries(systemClass.queries).forEach(([queryName, queryConfig]) => {
			const query = new Query(queryConfig);
			this[PRIVATE].queryManager.registerQuery(query);
			systemInstance[SYSTEM_PRIVATE].queries[queryName] = query;
		});

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

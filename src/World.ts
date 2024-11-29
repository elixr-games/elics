import { Component, ComponentConstructor } from './Component.js';
import { Entity, EntityLike } from './Entity.js';
import { Query, QueryConfig } from './Query.js';
import {
	PRIVATE as SYSTEM_PRIVATE,
	System,
	SystemConstructor,
} from './System.js';

import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

export const PRIVATE = Symbol('@elics/world');

export class World {
	[PRIVATE]: {
		entityManager: EntityManager;
		queryManager: QueryManager;
		componentManager: ComponentManager;
		systems: System[];
		entityPrototype: new (world: World, index: number) => EntityLike;
	} = {
		entityManager: new EntityManager(this),
		queryManager: new QueryManager(),
		componentManager: new ComponentManager(),
		systems: [],
		entityPrototype: Entity,
	};

	setEntityPrototype(prototype: new (world: World) => EntityLike): void {
		this[PRIVATE].entityPrototype = prototype;
	}

	registerComponent<T extends Component>(
		componentClass: ComponentConstructor<T>,
	): World {
		this[PRIVATE].componentManager.registerComponent(componentClass);

		return this;
	}

	createEntity(): EntityLike {
		return this[PRIVATE].entityManager.requestEntityInstance();
	}

	registerSystem<T extends System>(
		systemClass: SystemConstructor<T>,
		priority?: number,
	): World {
		if (this[PRIVATE].systems.some((system) => system instanceof systemClass)) {
			throw new Error('System already registered');
		}

		const queries: { [key: string]: Query } = {};

		Object.entries(systemClass.queries).forEach(([queryName, queryConfig]) => {
			queries[queryName] =
				this[PRIVATE].queryManager.registerQuery(queryConfig);
		});

		const systemInstance = new systemClass(
			this,
			this[PRIVATE].queryManager,
			priority,
		);

		systemInstance[SYSTEM_PRIVATE].queries = queries;
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

		return this;
	}

	unregisterSystem<T extends System>(systemClass: SystemConstructor<T>): void {
		this[PRIVATE].systems = this[PRIVATE].systems.filter(
			(system) => !(system instanceof systemClass),
		);
	}

	registerQuery(queryConfig: QueryConfig): World {
		this[PRIVATE].queryManager.registerQuery(queryConfig);
		return this;
	}

	update(delta: number, time: number): void {
		this[PRIVATE].systems.forEach((system) => {
			if (!system[SYSTEM_PRIVATE].isPaused) {
				system.update(delta, time);
			}
		});
	}

	getSystem<T extends System>(
		systemClass: SystemConstructor<T>,
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

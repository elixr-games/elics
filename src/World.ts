import { Entity, EntityConstructor, EntityLike } from './Entity.js';
import { Query, QueryConfig } from './Query.js';
import { System, SystemConstructor } from './System.js';

import { ComponentConstructor } from './Component.js';
import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

export class World {
	public entityManager!: EntityManager;
	public queryManager: QueryManager = new QueryManager();
	public componentManager!: ComponentManager;
	private systems: System[] = [];
	public entityPrototype: EntityConstructor = Entity;

	constructor(entityCapacity: number = 1000) {
		this.componentManager = new ComponentManager(entityCapacity);
		this.entityManager = new EntityManager(
			this.entityPrototype,
			this.queryManager,
			this.componentManager,
		);
	}

	registerComponent(componentClass: ComponentConstructor): World {
		this.componentManager.registerComponent(componentClass);
		return this;
	}

	createEntity(): EntityLike {
		return this.entityManager.requestEntityInstance();
	}

	registerSystem<T extends System>(
		systemClass: SystemConstructor<T>,
		priority?: number,
	): World {
		if (this.systems.some((system) => system instanceof systemClass)) {
			throw new Error('System already registered');
		}

		const queries: { [key: string]: Query } = {};

		Object.entries(systemClass.queries).forEach(([queryName, queryConfig]) => {
			queries[queryName] = this.queryManager.registerQuery(queryConfig);
		});

		const systemInstance = new systemClass(this, this.queryManager, priority);

		systemInstance.queries = queries;
		systemInstance.init();

		// Determine the correct position for the new system based on priority
		const insertIndex = this.systems.findIndex(
			(s) => s.priority > systemInstance.priority,
		);

		if (insertIndex === -1) {
			this.systems.push(systemInstance);
		} else {
			this.systems.splice(insertIndex, 0, systemInstance);
		}

		return this;
	}

	unregisterSystem<T extends System>(systemClass: SystemConstructor<T>): void {
		this.systems = this.systems.filter(
			(system) => !(system instanceof systemClass),
		);
	}

	registerQuery(queryConfig: QueryConfig): World {
		this.queryManager.registerQuery(queryConfig);
		return this;
	}

	update(delta: number, time: number): void {
		this.systems.forEach((system) => {
			if (!system.isPaused) {
				system.update(delta, time);
			}
		});
	}

	getSystem<T extends System>(
		systemClass: SystemConstructor<T>,
	): T | undefined {
		for (const system of this.systems) {
			if (system instanceof systemClass) {
				return system as T;
			}
		}
		return undefined;
	}

	getSystems(): System[] {
		return [...this.systems];
	}
}

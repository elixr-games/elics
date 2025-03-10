import { Entity, EntityConstructor, EntityLike } from './Entity.js';
import { ErrorMessages, assertCondition, toggleChecks } from './Checks.js';
import { Query, QueryConfig } from './Query.js';
import { System, SystemConstructor } from './System.js';

import { ComponentConstructor } from './Component.js';
import { ComponentManager } from './ComponentManager.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

export interface WorldOptions {
	entityCapacity: number;
	checksOn: boolean;
	deferredEntityUpdates: boolean;
}

export interface SystemOptions {
	configData: { [key: string]: any };
	priority: number;
}

export class World {
	public entityManager!: EntityManager;
	public queryManager!: QueryManager;
	public componentManager!: ComponentManager;
	private systems: System[] = [];
	public entityPrototype: EntityConstructor = Entity;
	readonly globals: { [key: string]: any } = {};

	constructor({
		entityCapacity = 1000,
		checksOn = true,
		deferredEntityUpdates = false,
	}: Partial<WorldOptions> = {}) {
		this.componentManager = new ComponentManager(entityCapacity);
		this.queryManager = new QueryManager(deferredEntityUpdates);
		this.entityManager = new EntityManager(
			this.entityPrototype,
			this.queryManager,
			this.componentManager,
		);
		toggleChecks(checksOn);
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
		options: Partial<SystemOptions> = {},
	): World {
		assertCondition(
			!this.systems.some((system) => system instanceof systemClass),
			ErrorMessages.SystemAlreadyRegistered,
			systemClass,
		);

		const { configData = {}, priority = 0 } = options;

		const queries: { [key: string]: Query } = {};

		Object.entries(systemClass.queries).forEach(([queryName, queryConfig]) => {
			queries[queryName] = this.queryManager.registerQuery(queryConfig);
		});

		const systemInstance = new systemClass(this, this.queryManager, priority);

		systemInstance.queries = queries;
		const config = Object.entries(systemClass.schema).reduce(
			(acc, [key, { default: defaultValue }]) => {
				acc[key] = key in configData ? configData[key] : defaultValue;
				return acc;
			},
			{} as Record<string, any>,
		);
		systemInstance.init(config);

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
		this.queryManager.deferredUpdate();
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

import { DataType, TypeValueToType } from './Types.js';
import { ErrorMessages, assertCondition, toggleChecks } from './Checks.js';
import { Query, QueryConfig } from './Query.js';
import {
	System,
	SystemConstructor,
	SystemQueries,
	SystemSchema,
} from './System.js';

import { Component } from './Component.js';
import { ComponentManager } from './ComponentManager.js';
import { Entity } from './Entity.js';
import { EntityManager } from './EntityManager.js';
import { QueryManager } from './QueryManager.js';

export interface WorldOptions {
	entityCapacity: number;
	checksOn: boolean;
}

export interface SystemOptions<T extends DataType, S extends SystemSchema<T>> {
	configData: Record<keyof S, TypeValueToType<T>>;
	priority: number;
}

export class World {
	public entityManager!: EntityManager;
	public queryManager!: QueryManager;
	public componentManager!: ComponentManager;
	private systems: System<any, any, any>[] = [];
	readonly globals: { [key: string]: any } = {};

	constructor({
		entityCapacity = 1000,
		checksOn = true,
	}: Partial<WorldOptions> = {}) {
		this.componentManager = new ComponentManager(entityCapacity);
		this.queryManager = new QueryManager();
		this.entityManager = new EntityManager(
			this.queryManager,
			this.componentManager,
		);
		toggleChecks(checksOn);
	}

	registerComponent(component: Component<any>): this {
		this.componentManager.registerComponent(component);
		return this;
	}

	createEntity(): Entity {
		return this.entityManager.requestEntityInstance();
	}

	registerSystem<
		T extends DataType,
		S extends SystemSchema<T>,
		Q extends SystemQueries,
		Sys extends System<T, S, Q> = System<T, S, Q>,
	>(
		systemClass: SystemConstructor<T, S, Q, typeof this, Sys>,
		options: Partial<SystemOptions<T, S>> = {},
	): this {
		assertCondition(
			!this.systems.some((system) => system instanceof systemClass),
			ErrorMessages.SystemAlreadyRegistered,
			systemClass,
		);

		const {
			configData = {} as Record<keyof S, TypeValueToType<T>>,
			priority = 0,
		} = options;

		const queries = {} as Record<keyof Q, Query>;

		Object.entries(systemClass.queries).forEach(([queryName, queryConfig]) => {
			queries[queryName as keyof Q] =
				this.queryManager.registerQuery(queryConfig);
		});

		const systemInstance = new systemClass(this, this.queryManager, priority);

		systemInstance.queries = queries;

		(Object.keys(configData) as (keyof S)[]).forEach((key) => {
			if (key in systemInstance.config) {
				systemInstance.config[key].value = configData[key];
			}
		});

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

	unregisterSystem<
		T extends DataType,
		S extends SystemSchema<T>,
		Q extends SystemQueries,
		Sys extends System<T, S, Q>,
	>(systemClass: SystemConstructor<T, S, Q, typeof this, Sys>): void {
		const systemInstance = this.getSystem(systemClass);
		if (systemInstance) {
			systemInstance.destroy();
			this.systems = this.systems.filter(
				(system) => !(system instanceof systemClass),
			);
		}
	}

	registerQuery(queryConfig: QueryConfig): this {
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

	getSystem<
		T extends DataType,
		S extends SystemSchema<T>,
		Q extends SystemQueries,
		Sys extends System<T, S, Q>,
	>(
		systemClass: SystemConstructor<T, S, Q, typeof this, Sys>,
	): Sys | undefined {
		for (const system of this.systems) {
			if (system instanceof systemClass) {
				return system as Sys;
			}
		}
		return undefined;
	}

	getSystems<T extends System<any, any, any> = System<any, any, any>>(): T[] {
		return this.systems as T[];
	}
}

import { TypeValueToType } from './types.js';
import { Query, QueryConfig } from './query.js';
import {
	System,
	SystemConstructor,
	SystemQueries,
	SystemSchema,
} from './system.js';

import { AnySystem, AnyComponent } from './types.js';
import { ComponentManager } from './component-manager.js';
import { Entity } from './entity.js';
import { EntityManager } from './entity-manager.js';
import { QueryManager } from './query-manager.js';
import { toggleChecks } from './checks.js';

export interface WorldOptions {
	entityCapacity: number;
	checksOn: boolean;
	entityReleaseCallback?: (entity: Entity) => void;
}

export interface SystemOptions<S extends SystemSchema> {
	configData: {
		[K in keyof S]: TypeValueToType<S[K]['type']>;
	};
	priority: number;
}

export class World {
	public entityManager!: EntityManager;

	public queryManager!: QueryManager;

	public componentManager!: ComponentManager;

	private systems: AnySystem[] = [];

	readonly globals: { [key: string]: unknown } = {};

	constructor({
		entityCapacity = 1000,
		checksOn = true,
		entityReleaseCallback,
	}: Partial<WorldOptions> = {}) {
		this.componentManager = new ComponentManager(entityCapacity);
		this.queryManager = new QueryManager(this.componentManager);
		this.entityManager = new EntityManager(
			this.queryManager,
			this.componentManager,
			entityReleaseCallback,
		);
		toggleChecks(checksOn);
	}

	registerComponent(component: AnyComponent): this {
		this.componentManager.registerComponent(component);
		return this;
	}

	hasComponent(component: AnyComponent): boolean {
		return this.componentManager.hasComponent(component);
	}

	createEntity(): Entity {
		return this.entityManager.requestEntityInstance();
	}

	registerSystem<
		S extends SystemSchema,
		Q extends SystemQueries,
		Sys extends System<S, Q> = System<S, Q>,
	>(
		systemClass: SystemConstructor<S, Q, typeof this, Sys>,
		options: Partial<SystemOptions<S>> = {},
	): this {
		if (this.hasSystem(systemClass)) {
			console.warn(
				`System ${systemClass.name} is already registered, skipping registration.`,
			);
			return this;
		}

		const {
			configData = {} as {
				[K in keyof S]: TypeValueToType<S[K]['type']>;
			},
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
		S extends SystemSchema,
		Q extends SystemQueries,
		Sys extends System<S, Q>,
	>(systemClass: SystemConstructor<S, Q, typeof this, Sys>): void {
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
		for (const system of this.systems) {
			if (!system.isPaused) {
				system.update(delta, time);
			}
		}
	}

	getSystem<
		S extends SystemSchema,
		Q extends SystemQueries,
		Sys extends System<S, Q>,
	>(systemClass: SystemConstructor<S, Q, typeof this, Sys>): Sys | undefined {
		for (const system of this.systems) {
			if (system instanceof systemClass) {
				return system as Sys;
			}
		}
		return undefined;
	}

	getSystems<T extends AnySystem = AnySystem>(): T[] {
		return this.systems as T[];
	}

	hasSystem<
		S extends SystemSchema,
		Q extends SystemQueries,
		Sys extends System<S, Q>,
	>(systemClass: SystemConstructor<S, Q, typeof this, Sys>): boolean {
		return this.systems.some((system) => system instanceof systemClass);
	}
}

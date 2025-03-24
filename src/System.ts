import { Query, QueryConfig } from './Query.js';

import { ComponentValue } from './Component.js';
import { DataType } from './Types.js';
import { Entity } from './Entity.js';
import { QueryManager } from './QueryManager.js';
import { World } from './World.js';

export type SystemSchema<T extends DataType> = Record<
	string,
	{
		type: T;
		default: ComponentValue<T>;
	}
>;

export type SystemQueries = Record<string, QueryConfig>;

export interface System<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
> {
	isPaused: boolean;
	config: Record<keyof S, ComponentValue<T>>;
	queries: Record<keyof Q, Query>;
	world: World;
	queryManager: QueryManager;
	priority: number;
	globals: Record<string, any>;
	getEntities(query: Query): Entity[];
	init(_configData: { [key: string]: any }): void;
	update(delta: number, time: number): void;
	play(): void;
	stop(): void;
}

export interface SystemConstructor<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
> {
	schema: S;
	isSystem: boolean;
	queries: Q;
	new (_w: World, _qm: QueryManager, _p: number): System<T, S, Q>;
}

export function createSystem<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
>(queries: Q = {} as Q, schema: S = {} as S): SystemConstructor<T, S, Q> {
	return class implements System<T, S, Q> {
		static schema = schema;
		static isSystem = true;
		static queries = queries;

		public isPaused: boolean = false;
		public queries!: Record<keyof Q, Query>;
		public config!: Record<keyof S, ComponentValue<T>>;

		constructor(
			public readonly world: World,
			public queryManager: QueryManager,
			public priority: number,
		) {}

		get globals() {
			return this.world.globals;
		}

		getEntities(query: Query): Entity[] {
			return this.queryManager.getEntities(query);
		}

		init(_configData: { [key: string]: any }): void {}

		update(_delta: number, _time: number): void {}

		play(): void {
			this.isPaused = false;
		}

		stop(): void {
			this.isPaused = true;
		}
	};
}

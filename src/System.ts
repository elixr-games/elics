import { DataType, TypeValueToType } from './Types.js';
import { Query, QueryConfig } from './Query.js';

import { QueryManager } from './QueryManager.js';
import { World } from './World.js';

export type SystemSchema<T extends DataType> = Record<
	string,
	{
		type: T;
		default: TypeValueToType<T>;
	}
>;

export type SystemQueries = Record<string, QueryConfig>;

export interface System<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
> {
	isPaused: boolean;
	config: Record<keyof S, TypeValueToType<T>>;
	queries: Record<keyof Q, Query>;
	world: World;
	queryManager: QueryManager;
	priority: number;
	globals: Record<string, any>;
	init(): void;
	update(delta: number, time: number): void;
	play(): void;
	stop(): void;
}

export interface SpecialSystem<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
> extends System<T, S, Q> {
	specialProp: boolean;
}

export interface SystemConstructor<
	T extends DataType,
	S extends SystemSchema<T>,
	Q extends SystemQueries,
	W extends World = World,
	Sys extends System<T, S, Q> = System<T, S, Q>,
> {
	schema: S;
	isSystem: boolean;
	queries: Q;
	new (_w: W, _qm: QueryManager, _p: number): Sys;
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
		public config = {} as Record<keyof S, TypeValueToType<T>>;

		constructor(
			public readonly world: World,
			public queryManager: QueryManager,
			public priority: number,
		) {
			for (const key in schema) {
				this.config[key] = schema[key].default;
			}
		}

		get globals() {
			return this.world.globals;
		}

		init(): void {}

		update(_delta: number, _time: number): void {}

		play(): void {
			this.isPaused = false;
		}

		stop(): void {
			this.isPaused = true;
		}
	};
}

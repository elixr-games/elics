import { Query, QueryConfig } from './query.js';
import { Signal, signal } from '@preact/signals-core';

import { Entity } from './entity.js';
import { QueryManager } from './query-manager.js';
import { TypeValueToType } from './types.js';
import { World } from './world.js';

export type SystemSchemaField =
	| { type: 'Int8'; default: number }
	| { type: 'Int16'; default: number }
	| { type: 'Float32'; default: number }
	| { type: 'Float64'; default: number }
	| { type: 'Boolean'; default: boolean }
	| { type: 'String'; default: string }
	| { type: 'Vec2'; default: [number, number] }
	| { type: 'Vec3'; default: [number, number, number] }
	| { type: 'Vec4'; default: [number, number, number, number] }
	| { type: 'Entity'; default: import('./entity.js').Entity | null }
	| { type: 'Object'; default: unknown }
	| { type: 'Enum'; default: string };

export type SystemSchema = Record<string, SystemSchemaField>;

export type SystemQueries = Record<string, QueryConfig>;

type SystemConfigSignals<S extends SystemSchema> = {
	[K in keyof S]: Signal<TypeValueToType<S[K]['type']>>;
};

export interface System<S extends SystemSchema, Q extends SystemQueries> {
	isPaused: boolean;
	config: SystemConfigSignals<S>;
	queries: Record<keyof Q, Query>;
	world: World;
	queryManager: QueryManager;
	priority: number;
	globals: { [key: string]: unknown };
	init(): void;
	update(delta: number, time: number): void;
	destroy(): void;
	play(): void;
	stop(): void;
	createEntity(): Entity;
}

export interface SpecialSystem<S extends SystemSchema, Q extends SystemQueries>
	extends System<S, Q> {
	specialProp: boolean;
}

export interface SystemConstructor<
	S extends SystemSchema,
	Q extends SystemQueries,
	W extends World = World,
	Sys extends System<S, Q> = System<S, Q>,
> {
	schema: S;
	isSystem: boolean;
	queries: Q;
	new (_w: W, _qm: QueryManager, _p: number): Sys;
}

export function createSystem<S extends SystemSchema, Q extends SystemQueries>(
	queries: Q = {} as Q,
	schema: S = {} as S,
): SystemConstructor<S, Q> {
	return class implements System<S, Q> {
		static schema = schema;

		static isSystem = true;

		static queries = queries;

		public isPaused: boolean = false;

		public queries!: Record<keyof Q, Query>;

		public config = {} as SystemConfigSignals<S>;

		constructor(
			public readonly world: World,
			public queryManager: QueryManager,
			public priority: number,
		) {
			for (const key in schema) {
				this.config[key] = signal(schema[key].default) as any;
			}
		}

		get globals() {
			return this.world.globals;
		}

		createEntity(): Entity {
			return this.world.createEntity();
		}

		init(): void {}

		update(_delta: number, _time: number): void {}

		play(): void {
			this.isPaused = false;
		}

		stop(): void {
			this.isPaused = true;
		}

		destroy(): void {}
	};
}

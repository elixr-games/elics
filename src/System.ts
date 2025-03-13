import { Query, QueryConfig } from './Query.js';

import { ComponentValue } from './Component.js';
import { EntityLike } from './Entity.js';
import { QueryManager } from './QueryManager.js';
import { Types } from './Types.js';
import { World } from './World.js';

export type SystemSchema<T extends Types> = Record<
	string,
	{
		type: T;
		default: ComponentValue<T>;
	}
>;
export abstract class System {
	static schema: SystemSchema<any> = {};
	static isSystem: true = true;
	static queries: {
		[key: string]: QueryConfig;
	} = {};

	public isPaused: boolean = false;
	public queries!: { [key: string]: Query };

	constructor(
		public readonly world: World,
		private queryManager: QueryManager,
		public priority: number,
	) {}

	get globals() {
		return this.world.globals;
	}

	getEntities(query: Query): EntityLike[] {
		return this.queryManager.getEntities(query);
	}

	abstract init(configData: { [key: string]: any }): void;

	abstract update(_delta: number, _time: number): void;

	play(): void {
		this.isPaused = false;
	}

	stop(): void {
		this.isPaused = true;
	}
}

export type SystemConstructor<T extends System> = {
	schema: { [key: string]: { type: Types; default: any } };
	new (_w: World, _qm: QueryManager, _p: number): T;
	readonly isSystem: true;
	queries: {
		[key: string]: QueryConfig;
	};
};

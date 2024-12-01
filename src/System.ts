import { Query, QueryConfig } from './Query.js';

import { EntityLike } from './Entity.js';
import { QueryManager } from './QueryManager.js';
import { World } from './World.js';

export class System {
	static isSystem: true = true;
	static queries: {
		[key: string]: QueryConfig;
	} = {};

	public isPaused: boolean = false;
	public queries!: { [key: string]: Query };

	constructor(
		public readonly world: World,
		private queryManager: QueryManager,
		public priority: number = 0,
	) {}

	get globals() {
		return this.world.globals;
	}

	getEntities(query: Query): EntityLike[] {
		return this.queryManager.getEntities(query);
	}

	init(): void {
		// Override in derived systems
	}

	update(_delta: number, _time: number): void {
		// Override in derived systems
	}

	play(): void {
		this.isPaused = false;
	}

	stop(): void {
		this.isPaused = true;
	}
}

export type SystemConstructor<T extends System> = {
	new (_w: World, _qm: QueryManager, _p?: number): T;
	readonly isSystem: true;
	queries: {
		[key: string]: QueryConfig;
	};
};

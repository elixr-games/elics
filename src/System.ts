import { Component } from './Component';
import { Entity } from './Entity';
import { Query } from './Query';
import { QueryManager } from './QueryManager';
import { World } from './World';

export const PRIVATE = Symbol('@elics/system');

export class System {
	static isSystem = true;
	static queries: {
		[key: string]: {
			required: (typeof Component)[];
			excluded: (typeof Component)[];
		};
	} = {};

	[PRIVATE]: {
		world: World;
		queryManager: QueryManager;
		isPaused: boolean;
		priority: number;
		queries: { [key: string]: Query };
	} = {
		world: null as any,
		queryManager: null as any,
		isPaused: false,
		priority: 0,
		queries: {},
	};

	constructor(world: World, queryManager: QueryManager, priority: number = 0) {
		this[PRIVATE].world = world;
		this[PRIVATE].queryManager = queryManager;
		this[PRIVATE].priority = priority;
	}

	get world(): World {
		return this[PRIVATE].world;
	}

	get isPaused(): boolean {
		return this[PRIVATE].isPaused;
	}

	get queries(): { [key: string]: Query } {
		return this[PRIVATE].queries;
	}

	get priority(): number {
		return this[PRIVATE].priority;
	}

	getEntities(query: Query): Entity[] {
		return this[PRIVATE].queryManager.getEntities(query);
	}

	init(): void {
		// Override in derived systems
	}

	update(_delta: number, _time: number): void {
		// Override in derived systems
	}

	play(): void {
		this[PRIVATE].isPaused = false;
	}

	stop(): void {
		this[PRIVATE].isPaused = true;
	}
}

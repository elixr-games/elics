import { Entity } from './Entity';
import { Query } from './Query';
import { QueryManager } from './QueryManager';
import { World } from './World';

export const PRIVATE = Symbol('@elics/system');

export abstract class System {
	static isSystem = true;

	[PRIVATE]: {
		world: World;
		queryManager: QueryManager;
		isPaused: boolean;
		priority: number;
	} = {
		world: null as any,
		queryManager: null as any,
		isPaused: false,
		priority: 0,
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

	registerQuery(query: Query): void {
		this[PRIVATE].queryManager.registerQuery(query);
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

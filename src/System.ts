import { World } from './World';

export const PRIVATE = Symbol('@elics/system');

export abstract class System {
	static isSystem = true;

	[PRIVATE]: {
		world: World;
		isPaused: boolean;
		priority: number;
	} = {
		world: null as any,
		isPaused: false,
		priority: 0,
	};

	constructor(world: World, priority: number = 0) {
		this[PRIVATE].world = world;
		this[PRIVATE].priority = priority;
	}

	get world(): World {
		return this[PRIVATE].world;
	}

	get isPaused(): boolean {
		return this[PRIVATE].isPaused;
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

import { PRIVATE as WORLD_PRIVATE, World } from './World.js';

import { ComponentMask } from './Component.js';
import { EntityLike } from './Entity.js';

export const PRIVATE = Symbol('@elics/entity-manager');

export class EntityManager {
	[PRIVATE]: {
		world: World;
		pool: EntityLike[];
		entityIndex: Map<ComponentMask, Set<EntityLike>>;
	} = {
		world: null as any,
		pool: [],
		entityIndex: new Map(),
	};

	constructor(world: World) {
		this[PRIVATE].world = world;
		this[PRIVATE].entityIndex = new Map();
	}

	requestEntityInstance(): EntityLike {
		let entity;
		if (this[PRIVATE].pool.length > 0) {
			entity = this[PRIVATE].pool.pop()!;
			entity.active = true;
		} else {
			const entityPrototype =
				this[PRIVATE].world[WORLD_PRIVATE].entityPrototype;
			entity = new entityPrototype(this[PRIVATE].world);
		}

		return entity;
	}

	releaseEntityInstance(entity: EntityLike): void {
		this[PRIVATE].pool.push(entity);
	}
}

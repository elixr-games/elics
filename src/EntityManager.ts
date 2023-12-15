import { PRIVATE as ENTITY_PRIVATE, Entity } from './Entity.js';

import { ComponentMask } from './Component.js';
import { World } from './World.js';

export const PRIVATE = Symbol('@elics/entity-manager');

export class EntityManager {
	[PRIVATE]: {
		world: World;
		pool: Entity[];
		entityIndex: Map<ComponentMask, Set<Entity>>;
	} = {
		world: null as any,
		pool: [],
		entityIndex: new Map(),
	};

	constructor(world: World) {
		this[PRIVATE].world = world;
		this[PRIVATE].entityIndex = new Map();
	}

	requestEntityInstance(): Entity {
		let entity;
		if (this[PRIVATE].pool.length > 0) {
			entity = this[PRIVATE].pool.pop()!;
			entity[ENTITY_PRIVATE].active = true;
		} else {
			entity = new Entity(this[PRIVATE].world);
		}

		return entity;
	}

	releaseEntityInstance(entity: Entity): void {
		this[PRIVATE].pool.push(entity);
	}
}

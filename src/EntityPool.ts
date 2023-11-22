import { PRIVATE as ENTITY_PRIVATE, Entity } from './Entity';

import { ComponentMask } from './Component';
import { Query } from './Query';
import { World } from './World';

export const PRIVATE = Symbol('@elics/entity-pool');

export class EntityPool {
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

	getEntity(): Entity {
		let entity;
		if (this[PRIVATE].pool.length > 0) {
			entity = this[PRIVATE].pool.pop()!;
			entity[ENTITY_PRIVATE].active = true;
		} else {
			entity = new Entity(this[PRIVATE].world, this);
		}

		this.updateEntityIndex(entity);
		return entity;
	}

	returnEntity(entity: Entity): void {
		this[PRIVATE].pool.push(entity);
		this.removeFromEntityIndex(entity);
	}

	updateEntityIndex(entity: Entity): void {
		const mask = entity[ENTITY_PRIVATE].componentMask;
		if (!this[PRIVATE].entityIndex.has(mask)) {
			this[PRIVATE].entityIndex.set(mask, new Set());
		}
		this[PRIVATE].entityIndex.get(mask)!.add(entity);
	}

	removeFromEntityIndex(entity: Entity): void {
		// call this method before an entity is destroyed
		const mask = entity[ENTITY_PRIVATE].componentMask;
		this[PRIVATE].entityIndex.get(mask)?.delete(entity);
	}

	getEntities(query: Query): Entity[] {
		let matchingEntities: Entity[] = [];
		this[PRIVATE].entityIndex.forEach((entities, mask) => {
			if (query.matchesMask(mask)) {
				matchingEntities.push(...entities);
			}
		});
		return matchingEntities;
	}
}

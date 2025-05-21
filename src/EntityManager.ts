import type { ComponentManager } from './ComponentManager.js';
import { Entity } from './Entity.js';
import type { QueryManager } from './QueryManager.js';

export class EntityManager {
	pool: Entity[] = [];
	private entityIndex = 0;
	private indexLookup: Map<number, Entity> = new Map();

	constructor(
		private queryManager: QueryManager,
		private componentManager: ComponentManager,
	) {}

	requestEntityInstance(): Entity {
		let entity;
		if (this.pool.length > 0) {
			entity = this.pool.pop()!;
			entity.active = true;
		} else {
			entity = new Entity(
				this,
				this.queryManager,
				this.componentManager,
				this.entityIndex++,
			);
		}

		this.indexLookup.set(entity.index, entity);

		return entity;
	}

	releaseEntityInstance(entity: Entity): void {
		this.indexLookup.delete(entity.index);
		this.pool.push(entity);
	}

	getEntityByIndex(index: number): Entity | undefined {
		return this.indexLookup.get(index);
	}
}

import type { ComponentManager } from './ComponentManager.js';
import { Entity } from './Entity.js';
import type { QueryManager } from './QueryManager.js';

export class EntityManager {
	pool: Entity[] = [];
	private entityIndex = 0;

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

		return entity;
	}

	releaseEntityInstance(entity: Entity): void {
		this.pool.push(entity);
	}
}

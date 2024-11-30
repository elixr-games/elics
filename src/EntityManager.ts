import type { EntityConstructor, EntityLike } from './Entity.js';

import type { ComponentManager } from './ComponentManager.js';
import type { QueryManager } from './QueryManager.js';

export class EntityManager {
	pool: EntityLike[] = [];
	private entityIndex = 0;

	constructor(
		public entityPrototype: EntityConstructor,
		private queryManager: QueryManager,
		private componentManager: ComponentManager,
	) {}

	requestEntityInstance(): EntityLike {
		let entity;
		if (this.pool.length > 0) {
			entity = this.pool.pop()!;
			entity.active = true;
		} else {
			entity = new this.entityPrototype(
				this,
				this.queryManager,
				this.componentManager,
				this.entityIndex++,
			);
		}

		return entity;
	}

	releaseEntityInstance(entity: EntityLike): void {
		this.pool.push(entity);
	}
}

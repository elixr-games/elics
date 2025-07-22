import type { ComponentManager } from './component-manager.js';
import { Entity } from './entity.js';
import type { QueryManager } from './query-manager.js';

export class EntityManager {
	pool: Entity[] = [];

	private entityIndex = 0;

	private indexLookup: (Entity | null)[] = [];

	private poolSize = 0;

	constructor(
		private queryManager: QueryManager,
		private componentManager: ComponentManager,
	) {}

	requestEntityInstance(): Entity {
		let entity;
		if (this.poolSize > 0) {
			entity = this.pool[--this.poolSize];
			entity.active = true;
		} else {
			entity = new Entity(
				this,
				this.queryManager,
				this.componentManager,
				this.entityIndex++,
			);
		}

		this.indexLookup[entity.index] = entity;

		return entity;
	}

	releaseEntityInstance(entity: Entity): void {
		this.indexLookup[entity.index] = null;
		this.pool[this.poolSize++] = entity;
	}

	getEntityByIndex(index: number): Entity | null {
		if (index === -1) {
			return null;
		}
		return this.indexLookup[index] ?? null;
	}
}

import type { ComponentManager } from './component-manager.js';
import { Entity } from './entity.js';
import type { QueryManager } from './query-manager.js';

export class EntityManager {
	pool: Entity[] = [];

	private entityIndex = 0;

	private indexLookup: (Entity | undefined)[] = [];

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
		this.indexLookup[entity.index] = undefined;
		this.pool[this.poolSize++] = entity;
	}

	getEntityByIndex(index: number): Entity | undefined {
		return this.indexLookup[index];
	}
}

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
		private entityReleaseCallback?: (entity: Entity) => void,
	) {}

	requestEntityInstance(): Entity {
		let entity;
		if (this.poolSize > 0) {
			entity = this.pool[--this.poolSize];
			entity.active = true;
			entity.generation = (entity.generation + 1) & 0xff; // 8-bit wrap
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
		this.entityReleaseCallback?.(entity);
		this.indexLookup[entity.index] = null;
		this.pool[this.poolSize++] = entity;
	}

	getEntityByIndex(index: number): Entity | null {
		if (index === -1) {
			return null;
		}
		return this.indexLookup[index] ?? null;
	}

	/**
	 * Pack an entity reference into a 32-bit value containing both index and generation.
	 * Format: [8 bits generation][24 bits index]
	 * This allows up to 16 million unique entity indices and 256 generations per slot.
	 */
	packEntityRef(entity: Entity | null): number {
		if (entity === null) {
			return -1;
		}
		return ((entity.generation & 0xff) << 24) | (entity.index & 0xffffff);
	}

	/**
	 * Unpack and resolve an entity reference, returning null if the entity
	 * has been destroyed (generation mismatch) or doesn't exist.
	 */
	getEntityByPackedRef(packedRef: number): Entity | null {
		if (packedRef === -1) {
			return null;
		}
		const index = packedRef & 0xffffff;
		const generation = (packedRef >>> 24) & 0xff;
		const entity = this.indexLookup[index];
		if (entity && entity.generation === generation) {
			return entity;
		}
		return null;
	}
}

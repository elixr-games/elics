/**
 * Entity Inspector - inspect and modify entity state
 */

import type { Entity } from '../entity.js';
import type { World } from '../world.js';
import type { AnyComponent } from '../types.js';
import type {
	EntityInspector,
	EntitySnapshot,
	ComponentSnapshot,
	Unsubscribe,
} from './types.js';

export function createEntityInspector(world: World): EntityInspector {
	const watchedEntities = new Map<
		Entity,
		Set<(snapshot: EntitySnapshot) => void>
	>();

	function getComponentSnapshot(
		entity: Entity,
		component: AnyComponent,
	): ComponentSnapshot {
		const values: Record<string, unknown> = {};

		for (const key of Object.keys(component.schema)) {
			try {
				values[key] = entity.getValue(component, key);
			} catch {
				// Component might not be attached or value unavailable
				values[key] = undefined;
			}
		}

		return {
			id: component.id,
			description: component.description,
			values,
		};
	}

	function getEntitySnapshot(entity: Entity): EntitySnapshot {
		const components = entity.getComponents();
		const componentSnapshots: ComponentSnapshot[] = [];

		for (const component of components) {
			componentSnapshots.push(getComponentSnapshot(entity, component));
		}

		return {
			index: entity.index,
			generation: entity.generation,
			active: entity.active,
			components: componentSnapshots,
		};
	}

	function getAllActiveEntities(): Entity[] {
		const entities: Entity[] = [];
		const entityManager = world.entityManager;

		// Access the internal indexLookup to find all entities
		// This is a bit hacky but necessary since there's no public API to iterate all entities
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const indexLookup = (entityManager as any).indexLookup as (Entity | null)[];

		if (indexLookup) {
			for (const entity of indexLookup) {
				if (entity && entity.active) {
					entities.push(entity);
				}
			}
		}

		return entities;
	}

	function notifyWatchers(entity: Entity): void {
		const callbacks = watchedEntities.get(entity);
		if (callbacks && callbacks.size > 0) {
			const snapshot = getEntitySnapshot(entity);
			for (const callback of callbacks) {
				callback(snapshot);
			}
		}
	}

	return {
		entity(entity: Entity): EntitySnapshot {
			return getEntitySnapshot(entity);
		},

		entities(): EntitySnapshot[] {
			const allEntities = getAllActiveEntities();
			return allEntities.map((e) => getEntitySnapshot(e));
		},

		entitiesByComponent(component: AnyComponent): Entity[] {
			const allEntities = getAllActiveEntities();
			return allEntities.filter((e) => e.hasComponent(component));
		},

		watch(
			entity: Entity,
			callback: (snapshot: EntitySnapshot) => void,
		): Unsubscribe {
			let callbacks = watchedEntities.get(entity);
			if (!callbacks) {
				callbacks = new Set();
				watchedEntities.set(entity, callbacks);
			}
			callbacks.add(callback);

			// Return unsubscribe function
			return () => {
				callbacks!.delete(callback);
				if (callbacks!.size === 0) {
					watchedEntities.delete(entity);
				}
			};
		},

		setValue<C extends AnyComponent>(
			entity: Entity,
			component: C,
			key: string,
			value: unknown,
		): void {
			// Use type assertion since we're in debug mode and accept any value
			// eslint-disable-next-line @typescript-eslint/no-explicit-any
			(entity as any).setValue(component, key, value);
			notifyWatchers(entity);
		},
	};
}

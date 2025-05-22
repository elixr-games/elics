import { Query, QueryConfig } from './Query.js';
import type { Component } from './Component.js';
import type { ComponentManager } from './ComponentManager.js';

import { Entity } from './Entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private entitiesToUpdate: Entity[] = [];
	private trackedEntities: Set<Entity> = new Set();
	private queriesByComponent: Map<Component<any>, Set<Query>> = new Map();

	constructor(
		private deferredEntityUpdates: boolean,
		private componentManager: ComponentManager,
	) {}

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			const newQuery = new Query(requiredMask, excludedMask, queryId);
			// populate query with existing entities that match
			this.trackedEntities.forEach((entity) => {
				if (newQuery.matches(entity)) {
					newQuery.entities.add(entity);
				}
			});
			const comps = [...query.required, ...(query.excluded ?? [])];
			comps.forEach((c) => {
				let set = this.queriesByComponent.get(c);
				if (!set) {
					set = new Set();
					this.queriesByComponent.set(c, set);
				}
				set.add(newQuery);
			});
			this.queries.set(queryId, newQuery);
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(
		entity: Entity,
		force = false,
		changedComponent?: Component<any>,
	): void {
		if (force || !this.deferredEntityUpdates) {
			this.trackedEntities.add(entity);
			if (entity.bitmask.isEmpty()) {
				// Remove entity from all query results if it has no components
				this.queries.forEach((query) => query.entities.delete(entity));
				return;
			}

			const queries = changedComponent
				? (this.queriesByComponent.get(changedComponent) ?? [])
				: this.queries.values();

			for (const query of queries as Iterable<Query>) {
				const matches = query.matches(entity);
				const isInResultSet = query.entities.has(entity);

				if (matches && !isInResultSet) {
					query.entities.add(entity);
					query.subscribers.qualify.forEach((callback) => {
						callback(entity);
					});
				} else if (!matches && isInResultSet) {
					query.entities.delete(entity);
					query.subscribers.disqualify.forEach((callback) => {
						callback(entity);
					});
				}
			}
		} else {
			if (!entity.dirty) {
				entity.dirty = true;
				this.entitiesToUpdate.push(entity);
			}
		}
	}

	resetEntity(entity: Entity): void {
		this.trackedEntities.delete(entity);
		// remove pending updates for this entity
		const idx = this.entitiesToUpdate.indexOf(entity);
		if (idx !== -1) {
			this.entitiesToUpdate.splice(idx, 1);
		}
		entity.dirty = false;
		let bits = entity.bitmask.bits;
		if (bits === 0) {
			this.queries.forEach((query) => query.entities.delete(entity));
			return;
		}
		const processed = new Set<Query>();
		while (bits !== 0) {
			const i = Math.floor(Math.log2(bits & -bits));
			const component = this.componentManager.getComponentByTypeId(i)!;
			const queries = this.queriesByComponent.get(component);
			if (queries) {
				for (const query of queries) {
					if (!processed.has(query)) {
						query.entities.delete(entity);
						processed.add(query);
					}
				}
			}
			bits &= bits - 1;
		}
	}

	deferredUpdate(): void {
		if (this.deferredEntityUpdates) {
			for (const entity of this.entitiesToUpdate) {
				this.updateEntity(entity, true);
				entity.dirty = false;
			}
			this.entitiesToUpdate.length = 0;
		}
	}
}

import { Query, QueryConfig } from './Query.js';

import { Entity } from './Entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private entitiesToUpdate: Entity[] = [];
	private trackedEntities: Set<Entity> = new Set();

	constructor(private deferredEntityUpdates: boolean) {}

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
			this.queries.set(queryId, newQuery);
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(entity: Entity, force = false): void {
		if (force || !this.deferredEntityUpdates) {
			this.trackedEntities.add(entity);
			if (entity.bitmask.isEmpty()) {
				// Remove entity from all query results if it has no components
				this.queries.forEach((query) => query.entities.delete(entity));
				return;
			}

			this.queries.forEach((query) => {
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
			});
		} else {
			if (!entity.dirty) {
				entity.dirty = true;
				this.entitiesToUpdate.push(entity);
			}
		}
	}

	resetEntity(entity: Entity): void {
		this.trackedEntities.delete(entity);
		this.queries.forEach((query) => query.entities.delete(entity));
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

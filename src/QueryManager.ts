import { Query, QueryConfig } from './Query.js';

import { Entity } from './Entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private entitiesToUpdate: Set<Entity> = new Set();

	constructor(private deferredEntityUpdates: boolean) {}

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			this.queries.set(queryId, new Query(requiredMask, excludedMask, queryId));
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(entity: Entity, force = false): void {
		if (force || !this.deferredEntityUpdates) {
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
			this.entitiesToUpdate.add(entity);
		}
	}

	resetEntity(entity: Entity): void {
		this.queries.forEach((query) => query.entities.delete(entity));
	}

	deferredUpdate(): void {
		if (this.deferredEntityUpdates) {
			this.entitiesToUpdate.forEach((entity) =>
				this.updateEntity(entity, true),
			);
			this.entitiesToUpdate.clear();
		}
	}
}

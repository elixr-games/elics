import { Query, QueryConfig } from './Query.js';

import { EntityLike } from './Entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private results: Map<Query, Set<EntityLike>> = new Map();

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			this.queries.set(queryId, new Query(requiredMask, excludedMask, queryId));
			this.results.set(this.queries.get(queryId)!, new Set());
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(entity: EntityLike): void {
		if (entity.bitmask.isEmpty()) {
			// Remove entity from all query results if it has no components
			this.results.forEach((entities) => entities.delete(entity));
			return;
		}

		this.results.forEach((entities, query) => {
			const matches = query.matches(entity);
			const isInResultSet = entities.has(entity);

			if (matches && !isInResultSet) {
				entities.add(entity);
			} else if (!matches && isInResultSet) {
				entities.delete(entity);
			}
		});
	}

	getEntities(query: Query): EntityLike[] {
		if (!this.queries.has(query.queryId)) {
			throw new Error(`Query not registered: ${query.queryId}`);
		}
		return Array.from(this.results.get(query) || []);
	}
}

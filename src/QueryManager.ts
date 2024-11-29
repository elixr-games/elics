import { Query, QueryConfig } from './Query.js';

import { EntityLike } from './Entity.js';

export const PRIVATE = Symbol('@elics/query-manager');

export class QueryManager {
	[PRIVATE]: {
		queries: Map<string, Query>;
		results: Map<Query, Set<EntityLike>>;
	} = {
		queries: new Map(),
		results: new Map(),
	};

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this[PRIVATE].queries.has(queryId)) {
			this[PRIVATE].queries.set(
				queryId,
				new Query(requiredMask, excludedMask, queryId),
			);
			this[PRIVATE].results.set(this[PRIVATE].queries.get(queryId)!, new Set());
		}
		return this[PRIVATE].queries.get(queryId)!;
	}

	updateEntity(entity: EntityLike): void {
		if (entity.bitmask.isEmpty()) {
			// Remove entity from all query results if it has no components
			this[PRIVATE].results.forEach((entities) => entities.delete(entity));
			return;
		}

		this[PRIVATE].results.forEach((entities, query) => {
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
		if (!this[PRIVATE].queries.has(query.queryId)) {
			throw new Error(`Query not registered: ${query.queryId}`);
		}
		return Array.from(this[PRIVATE].results.get(query) || []);
	}
}

import { ErrorMessages, assertCondition } from './Checks.js';
import { Query, QueryConfig } from './Query.js';

import { EntityLike } from './Entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private results: Map<Query, Set<EntityLike>> = new Map();
	private entitiesToUpdate: Set<EntityLike> = new Set();

	constructor(private deferredEntityUpdates: boolean) {}

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			this.queries.set(queryId, new Query(requiredMask, excludedMask, queryId));
			this.results.set(this.queries.get(queryId)!, new Set());
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(entity: EntityLike, force = false): void {
		if (force || !this.deferredEntityUpdates) {
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
		} else {
			this.entitiesToUpdate.add(entity);
		}
	}

	deferredUpdate(): void {
		if (this.deferredEntityUpdates) {
			this.entitiesToUpdate.forEach((entity) =>
				this.updateEntity(entity, true),
			);
			this.entitiesToUpdate.clear();
		}
	}

	getEntities(query: Query): EntityLike[] {
		assertCondition(
			this.queries.has(query.queryId),
			ErrorMessages.QueryNotRegistered,
			query.queryId,
		);
		return Array.from(this.results.get(query) || []);
	}
}

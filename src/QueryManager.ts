import { PRIVATE as ENTITY_PRIVATE, Entity } from './Entity';

import { EntityPool } from './EntityPool';
import { Query } from './Query';

export const PRIVATE = Symbol('@elics/query-manager');

export class QueryManager {
	[PRIVATE]: {
		queries: Map<string, Set<Entity>>;
		entityPool: EntityPool;
	} = {
		queries: new Map(),
		entityPool: null as any,
	};

	constructor(entityPool: EntityPool) {
		this[PRIVATE].entityPool = entityPool;
	}

	registerQuery(query: Query): void {
		const identifier = query.queryId;
		if (!this[PRIVATE].queries.has(identifier)) {
			const matchingEntities = this[PRIVATE].entityPool.getEntities(query);
			this[PRIVATE].queries.set(identifier, new Set(matchingEntities));
		}
	}

	updateEntity(entity: Entity): void {
		if (entity[ENTITY_PRIVATE].componentMask === 0) {
			// Remove entity from all query results if it has no components
			this[PRIVATE].queries.forEach((entities) => entities.delete(entity));
			return;
		}

		this[PRIVATE].queries.forEach((entities, queryId) => {
			const matches = Query.matchesQuery(
				queryId,
				entity[ENTITY_PRIVATE].componentMask,
			);
			const isInResultSet = entities.has(entity);

			if (matches && !isInResultSet) {
				entities.add(entity);
			} else if (!matches && isInResultSet) {
				entities.delete(entity);
			}
		});
	}

	getEntities(query: Query): Entity[] {
		const identifier = query.queryId;
		if (!this[PRIVATE].queries.has(identifier)) {
			throw new Error(`Query not registered: ${identifier}`);
		}
		return Array.from(this[PRIVATE].queries.get(identifier) || []);
	}
}

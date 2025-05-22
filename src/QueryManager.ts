import { Query, QueryConfig } from './Query.js';

import { Entity } from './Entity.js';
import type { Component } from './Component.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();
	private trackedEntities: Set<Entity> = new Set();
	private queriesByComponent: Map<number, Set<Query>> = new Map();

	constructor() {}

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

			const allComponents = [...query.required, ...(query.excluded ?? [])];
			allComponents.forEach((component) => {
				const list = this.queriesByComponent.get(component.typeId);
				if (list) {
					list.add(newQuery);
				} else {
					this.queriesByComponent.set(component.typeId, new Set([newQuery]));
				}
			});
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(
		entity: Entity,
		changed?: Component<any> | Component<any>[],
	): void {
		this.trackedEntities.add(entity);
		if (entity.bitmask.isEmpty()) {
			// Remove entity from all query results if it has no components
			this.queries.forEach((query) => query.entities.delete(entity));
			return;
		}

		let queriesToUpdate: Set<Query>;
		if (changed) {
			const comps = Array.isArray(changed) ? changed : [changed];
			queriesToUpdate = new Set();
			for (const c of comps) {
				const q = this.queriesByComponent.get(c.typeId);
				if (q) q.forEach((qry) => queriesToUpdate.add(qry));
			}
		} else {
			queriesToUpdate = new Set(this.queries.values());
		}

		queriesToUpdate.forEach((query) => {
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
	}

	resetEntity(entity: Entity): void {
		this.trackedEntities.delete(entity);
		this.queries.forEach((query) => query.entities.delete(entity));
	}
}

import { Query, QueryConfig } from './query.js';
import type { Component } from './component.js';
import type { ComponentManager } from './component-manager.js';

import { Entity } from './entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();

	private trackedEntities: Set<Entity> = new Set();

	private queriesByComponent: Map<Component<any>, Set<Query>> = new Map();

	constructor(private componentManager: ComponentManager) {}

	registerQuery(query: QueryConfig): Query {
		const { requiredMask, excludedMask, queryId } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			const newQuery = new Query(requiredMask, excludedMask, queryId);
			// populate query with existing entities that match
			for (const entity of this.trackedEntities) {
				if (newQuery.matches(entity)) {
					newQuery.entities.add(entity);
				}
			}
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

	updateEntity(entity: Entity, changedComponent?: Component<any>): void {
		this.trackedEntities.add(entity);
		if (entity.bitmask.isEmpty()) {
			// Remove entity from all query results if it has no components
			for (const query of this.queries.values()) {
				query.entities.delete(entity);
			}
			return;
		}

		const queries = changedComponent
			? (this.queriesByComponent.get(changedComponent) ?? [])
			: this.queries.values();

		for (const query of queries as Iterable<Query>) {
			const matches = query.matches(entity);
			const isInResultSet = query.entities.has(entity);

			if (matches !== isInResultSet) {
				if (matches) {
					query.entities.add(entity);
					if (query.subscribers.qualify.size > 0) {
						for (const callback of query.subscribers.qualify) {
							callback(entity);
						}
					}
				} else {
					query.entities.delete(entity);
					if (query.subscribers.disqualify.size > 0) {
						for (const callback of query.subscribers.disqualify) {
							callback(entity);
						}
					}
				}
			}
		}
	}

	resetEntity(entity: Entity): void {
		this.trackedEntities.delete(entity);

		// Fast path: remove from all queries if entity has no components
		if (entity.bitmask.bits === 0) {
			for (const query of this.queries.values()) {
				if (query.entities.delete(entity)) {
					if (query.subscribers.disqualify.size > 0) {
						for (const callback of query.subscribers.disqualify) {
							callback(entity);
						}
					}
				}
			}
			return;
		}

		// Remove entity from relevant queries based on components
		const processed = new Set<Query>();
		let bits = entity.bitmask.bits;
		while (bits !== 0) {
			const i = Math.floor(Math.log2(bits & -bits));
			const component = this.componentManager.getComponentByTypeId(i)!;
			const queries = this.queriesByComponent.get(component);
			if (queries) {
				for (const query of queries) {
					if (!processed.has(query)) {
						if (query.entities.delete(entity)) {
							if (query.subscribers.disqualify.size > 0) {
								for (const callback of query.subscribers.disqualify) {
									callback(entity);
								}
							}
						}
						processed.add(query);
					}
				}
			}
			bits &= bits - 1;
		}
	}
}

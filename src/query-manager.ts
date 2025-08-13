import { Query, QueryConfig } from './query.js';
import type { ComponentManager } from './component-manager.js';
import type { AnyComponent } from './types.js';
import { Entity } from './entity.js';

export class QueryManager {
	private queries: Map<string, Query> = new Map();

	private trackedEntities: Set<Entity> = new Set();

	private queriesByComponent: Map<AnyComponent, Set<Query>> = new Map();

	private queriesByValueComponent: Map<AnyComponent, Set<Query>> = new Map();

	constructor(private componentManager: ComponentManager) {}

	registerQuery(query: QueryConfig): Query {
		for (const component of query.required) {
			if (component.bitmask === null) {
				this.componentManager.registerComponent(component);
			}
		}
		if (query.excluded) {
			for (const component of query.excluded) {
				if (component.bitmask === null) {
					this.componentManager.registerComponent(component);
				}
			}
		}
		if (query.where) {
			for (const p of query.where) {
				if (p.component.bitmask === null) {
					this.componentManager.registerComponent(p.component);
				}
			}
		}

		const { requiredMask, excludedMask, queryId, valuePredicates } =
			Query.generateQueryInfo(query);
		if (!this.queries.has(queryId)) {
			const newQuery = new Query(
				requiredMask,
				excludedMask,
				queryId,
				valuePredicates,
			);
			for (const entity of this.trackedEntities) {
				if (newQuery.matches(entity)) {
					newQuery.entities.add(entity);
				}
			}

			const comps = [
				...query.required,
				...(query.excluded ?? []),
				...((query.where ?? []).map((p) => p.component) as AnyComponent[]),
			];
			for (const c of comps) {
				let set = this.queriesByComponent.get(c);
				if (!set) {
					set = new Set();
					this.queriesByComponent.set(c, set);
				}
				set.add(newQuery);
			}
			// Track value-predicate components separately for efficient value updates
			for (const p of query.where ?? []) {
				let set = this.queriesByValueComponent.get(p.component);
				if (!set) {
					set = new Set();
					this.queriesByValueComponent.set(p.component, set);
				}
				set.add(newQuery);
			}
			this.queries.set(queryId, newQuery);
		}
		return this.queries.get(queryId)!;
	}

	updateEntity(entity: Entity, changedComponent?: AnyComponent): void {
		this.trackedEntities.add(entity);
		if (entity.bitmask.isEmpty()) {
			for (const query of this.queries.values()) {
				if (query.entities.delete(entity)) {
					for (const cb of query.subscribers.disqualify) {
						cb(entity);
					}
				}
			}
			return;
		}

		const queries = changedComponent
			? (this.queriesByComponent.get(changedComponent) ?? [])
			: this.queries.values();
		for (const query of queries as Iterable<Query>) {
			const matches = query.matches(entity);
			const inSet = query.entities.has(entity);
			if (matches && !inSet) {
				query.entities.add(entity);
				for (const cb of query.subscribers.qualify) {
					cb(entity);
				}
			} else if (!matches && inSet) {
				query.entities.delete(entity);
				for (const cb of query.subscribers.disqualify) {
					cb(entity);
				}
			}
		}
	}

	// Optimized path for value changes: only check queries that have value predicates on this component
	updateEntityValue(entity: Entity, component: AnyComponent): void {
		this.trackedEntities.add(entity);
		const queries = this.queriesByValueComponent.get(component);
		if (!queries || queries.size === 0) {
			return;
		}
		for (const query of queries) {
			const matches = query.matches(entity);
			const inSet = query.entities.has(entity);
			if (matches && !inSet) {
				query.entities.add(entity);
				for (const cb of query.subscribers.qualify) {
					cb(entity);
				}
			} else if (!matches && inSet) {
				query.entities.delete(entity);
				for (const cb of query.subscribers.disqualify) {
					cb(entity);
				}
			}
		}
	}

	resetEntity(entity: Entity): void {
		this.trackedEntities.delete(entity);
		if (entity.bitmask.isEmpty()) {
			for (const query of this.queries.values()) {
				if (query.entities.delete(entity)) {
					for (const cb of query.subscribers.disqualify) {
						cb(entity);
					}
				}
			}
			return;
		}
		const processed = new Set<Query>();
		for (const i of entity.bitmask.toArray()) {
			const component = this.componentManager.getComponentByTypeId(i)!;
			const qs = this.queriesByComponent.get(component);
			if (!qs) {
				continue;
			}
			for (const q of qs) {
				if (processed.has(q)) {
					continue;
				}
				if (q.entities.delete(entity))
					for (const cb of q.subscribers.disqualify) cb(entity);
				processed.add(q);
			}
		}
	}
}

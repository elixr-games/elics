import type { Component, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import { Entity } from './Entity.js';

export type QueryConfig = {
	required: Component<any>[];
	excluded?: Component<any>[];
};

export class Query {
	public subscribers = {
		qualify: new Set<(entity: Entity) => void>(),
		disqualify: new Set<(entity: Entity) => void>(),
	};
	public entities = new Set<Entity>();

	constructor(
		private requiredMask: ComponentMask,
		private excludedMask: ComponentMask,
		public queryId: string,
	) {}

	matches(entity: Entity) {
		const hasRequired = entity.bitmask
			.and(this.requiredMask)
			.equals(this.requiredMask);
		const hasExcluded = !entity.bitmask.and(this.excludedMask).isEmpty();

		return hasRequired && !hasExcluded;
	}

	subscribe(
		event: 'qualify' | 'disqualify',
		callback: (entity: Entity) => void,
	) {
		this.subscribers[event].add(callback);
		return () => {
			this.subscribers[event].delete(callback);
		};
	}

	static generateQueryInfo(queryConfig: QueryConfig) {
		let requiredMask = new BitSet();
		let excludedMask = new BitSet();
		queryConfig.required.forEach((c) => {
			requiredMask = requiredMask.or(c.bitmask!);
		});
		queryConfig.excluded?.forEach((c) => {
			excludedMask = excludedMask.or(c.bitmask!);
		});
		return {
			requiredMask,
			excludedMask,
			queryId: `required:${requiredMask.toString()}|excluded:${excludedMask.toString()}`,
		};
	}
}

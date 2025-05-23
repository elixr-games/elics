import type { Component, ComponentMask } from './Component.js';

import BitSet from './BitSet.js';
import { Entity } from './Entity.js';
import { assertCondition, ErrorMessages } from './Checks.js';

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

	matches(entity: Entity): boolean {
		const hasRequired = entity.bitmask.contains(this.requiredMask);
		const hasExcluded = entity.bitmask.intersects(this.excludedMask);

		return hasRequired && !hasExcluded;
	}

	subscribe(
		event: 'qualify' | 'disqualify',
		callback: (entity: Entity) => void,
	): () => void {
		this.subscribers[event].add(callback);
		return () => {
			this.subscribers[event].delete(callback);
		};
	}

	static generateQueryInfo(queryConfig: QueryConfig): {
		requiredMask: BitSet;
		excludedMask: BitSet;
		queryId: string;
	} {
		const requiredMask = new BitSet();
		const excludedMask = new BitSet();
		for (const c of queryConfig.required) {
			assertCondition(
				c.bitmask !== null,
				ErrorMessages.ComponentNotRegistered,
				c,
			);
			requiredMask.orInPlace(c.bitmask!);
		}
		if (queryConfig.excluded) {
			for (const c of queryConfig.excluded) {
				assertCondition(
					c.bitmask !== null,
					ErrorMessages.ComponentNotRegistered,
					c,
				);
				excludedMask.orInPlace(c.bitmask!);
			}
		}
		return {
			requiredMask,
			excludedMask,
			queryId: `required:${requiredMask.toString()}|excluded:${excludedMask.toString()}`,
		};
	}
}

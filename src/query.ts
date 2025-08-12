import type { ComponentMask } from './component.js';
import type { AnyComponent } from './types.js';

import BitSet from './bit-set.js';
import { Entity } from './entity.js';

export type QueryConfig = {
	required: AnyComponent[];
	excluded?: AnyComponent[];
};

export class Query {
	public subscribers = {
		qualify: new Set<(entity: Entity) => void>(),
		disqualify: new Set<(entity: Entity) => void>(),
	};

	public entities = new Set<Entity>();

	constructor(
		public requiredMask: ComponentMask,
		public excludedMask: ComponentMask,
		public queryId: string,
	) {}

	matches(entity: Entity): boolean {
		// Excluded: if any excluded bit is present on entity -> no match
		if (
			!this.excludedMask.isEmpty() &&
			this.excludedMask.intersects(entity.bitmask)
		) {
			return false;
		}
		// Required: entity must contain all required bits
		return entity.bitmask.contains(this.requiredMask);
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
			requiredMask.orInPlace(c.bitmask!);
		}
		if (queryConfig.excluded) {
			for (const c of queryConfig.excluded) {
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

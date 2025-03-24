import type { ComponentConstructor, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import { Entity } from './Entity.js';

export type QueryConfig = {
	required: ComponentConstructor<any>[];
	excluded?: ComponentConstructor<any>[];
};

export class Query {
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

import { Component, ComponentConstructor, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import { EntityLike } from './Entity.js';

export const PRIVATE = Symbol('@elics/query');

export type QueryConfig<T extends Component = Component> = {
	required: ComponentConstructor<T>[];
	excluded?: ComponentConstructor<T>[];
};

export class Query {
	[PRIVATE]: {
		requiredMask: ComponentMask;
		excludedMask: ComponentMask;
		queryId: string;
	};

	constructor(
		requiredMask: ComponentMask,
		excludedMask: ComponentMask,
		queryId: string,
	) {
		this[PRIVATE] = {
			requiredMask,
			excludedMask,
			queryId,
		};
	}

	matches(entity: EntityLike) {
		const hasRequired = entity.bitmask
			.and(this[PRIVATE].requiredMask)
			.equals(this[PRIVATE].requiredMask);
		const hasExcluded = !entity.bitmask
			.and(this[PRIVATE].excludedMask)
			.isEmpty();

		return hasRequired && !hasExcluded;
	}

	get queryId() {
		return this[PRIVATE].queryId;
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

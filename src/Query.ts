import { Component, ComponentMask } from './Component';

export class Query {
	private requiredComponents: Set<ComponentMask>;
	private excludedComponents: Set<ComponentMask>;

	constructor(
		required: (typeof Component)[],
		excluded: (typeof Component)[] = [],
	) {
		this.requiredComponents = new Set(required.map((c) => c.bitmask || 0));
		this.excludedComponents = new Set(excluded.map((c) => c.bitmask || 0));
	}

	matchesMask(mask: ComponentMask): boolean {
		for (let requiredMask of this.requiredComponents) {
			if ((mask & requiredMask) !== requiredMask) {
				return false;
			}
		}

		for (let excludedMask of this.excludedComponents) {
			if ((mask & excludedMask) === excludedMask) {
				return false;
			}
		}

		return true;
	}
}

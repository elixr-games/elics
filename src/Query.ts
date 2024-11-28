import { Component, ComponentConstructor, ComponentMask } from './Component.js';

export const PRIVATE = Symbol('@elics/query');

export type QueryConfig<T extends Component = Component> = {
	required: ComponentConstructor<T>[];
	excluded?: ComponentConstructor<T>[];
};

export class Query<T extends Component = Component> {
	[PRIVATE]: {
		requiredComponents: Set<ComponentMask>;
		excludedComponents: Set<ComponentMask>;
		queryId: string;
	} = {
		requiredComponents: new Set(),
		excludedComponents: new Set(),
		queryId: '',
	};

	constructor({ required, excluded = [] }: QueryConfig<T>) {
		this[PRIVATE].requiredComponents = new Set(
			required.map((c) => c.bitmask || 0),
		);
		this[PRIVATE].excludedComponents = new Set(
			excluded.map((c) => c.bitmask || 0),
		);

		this[PRIVATE].queryId = Query.generateQueryId(
			this[PRIVATE].requiredComponents,
			this[PRIVATE].excludedComponents,
		);
	}

	static generateQueryId(
		requiredComponents: Set<ComponentMask>,
		excludedComponents: Set<ComponentMask>,
	): string {
		const requiredMask = Array.from(requiredComponents).reduce(
			(acc, val) => acc | val,
			0,
		);
		const excludedMask = Array.from(excludedComponents).reduce(
			(acc, val) => acc | val,
			0,
		);
		return `required:${requiredMask}|excluded:${excludedMask}`;
	}

	static matchesQuery(queryId: string, mask: ComponentMask): boolean {
		const [requiredPart, excludedPart] = queryId.split('|');
		const requiredMask = parseInt(requiredPart.split(':')[1], 10);
		const excludedMask = parseInt(excludedPart.split(':')[1], 10);

		if ((mask & requiredMask) !== requiredMask) {
			return false;
		}

		// Skip the excluded mask check if excludedMask is 0 (no components to exclude)
		if (excludedMask !== 0 && (mask & excludedMask) === excludedMask) {
			return false;
		}

		return true;
	}

	get queryId(): string {
		return this[PRIVATE].queryId;
	}
}

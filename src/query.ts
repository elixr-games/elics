import type { ComponentMask } from './component.js';
import type { AnyComponent } from './types.js';
import { Types } from './types.js';

import BitSet from './bit-set.js';
import { Entity } from './entity.js';

export type ComparisonOperator =
	| 'eq'
	| 'ne'
	| 'lt'
	| 'le'
	| 'gt'
	| 'ge'
	| 'in'
	| 'nin';

export type ValuePredicate = {
	component: AnyComponent;
	key: string;
	op: ComparisonOperator;
	value: unknown;
};

export type QueryConfig = {
	required: AnyComponent[];
	excluded?: AnyComponent[];
	where?: ValuePredicate[];
};

export class Query {
	public subscribers = {
		qualify: new Set<(entity: Entity) => void>(),
		disqualify: new Set<(entity: Entity) => void>(),
	};

	public entities = new Set<Entity>();

	private valuePredicates: (ValuePredicate & { valueSet?: Set<unknown> })[] =
		[];

	constructor(
		public requiredMask: ComponentMask,
		public excludedMask: ComponentMask,
		public queryId: string,
		valuePredicates: (ValuePredicate & { valueSet?: Set<unknown> })[] = [],
	) {
		this.valuePredicates = valuePredicates;
	}

	matches(entity: Entity): boolean {
		// Excluded: if any excluded bit is present on entity -> no match
		if (
			!this.excludedMask.isEmpty() &&
			this.excludedMask.intersects(entity.bitmask)
		) {
			return false;
		}
		// Required: entity must contain all required bits
		if (!entity.bitmask.contains(this.requiredMask)) {
			return false;
		}
		// Value predicates: verify values
		if (this.valuePredicates.length > 0) {
			for (const p of this.valuePredicates) {
				const v = entity.getValue(
					p.component,
					p.key as keyof typeof p.component.schema,
				);
				switch (p.op) {
					case 'eq':
						if (v !== p.value) {
							return false;
						}
						break;
					case 'ne':
						if (v === p.value) {
							return false;
						}
						break;
					case 'lt':
						if (
							!(
								typeof v === 'number' &&
								typeof p.value === 'number' &&
								v < p.value
							)
						) {
							return false;
						}
						break;
					case 'le':
						if (
							!(
								typeof v === 'number' &&
								typeof p.value === 'number' &&
								v <= p.value
							)
						) {
							return false;
						}
						break;
					case 'gt':
						if (
							!(
								typeof v === 'number' &&
								typeof p.value === 'number' &&
								v > p.value
							)
						) {
							return false;
						}
						break;
					case 'ge':
						if (
							!(
								typeof v === 'number' &&
								typeof p.value === 'number' &&
								v >= p.value
							)
						) {
							return false;
						}
						break;
					case 'in':
						if (!p.valueSet || !p.valueSet.has(v)) {
							return false;
						}
						break;
					case 'nin':
						if (p.valueSet && p.valueSet.has(v)) {
							return false;
						}
						break;
				}
			}
		}
		return true;
	}

	subscribe(
		event: 'qualify' | 'disqualify',
		callback: (entity: Entity) => void,
		replayExisting: boolean = false,
	): () => void {
		this.subscribers[event].add(callback);
		if (event === 'qualify' && replayExisting) {
			for (const e of this.entities) {
				callback(e);
			}
		}
		return () => {
			this.subscribers[event].delete(callback);
		};
	}

	static generateQueryInfo(queryConfig: QueryConfig): {
		requiredMask: BitSet;
		excludedMask: BitSet;
		queryId: string;
		valuePredicates: (ValuePredicate & { valueSet?: Set<unknown> })[];
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
		// Normalize and validate predicates
		const rawPreds = queryConfig.where ?? [];
		const preds: (ValuePredicate & { valueSet?: Set<unknown> })[] =
			rawPreds.map((p) => {
				const schema = (
					p.component.schema as Record<
						string,
						import('./types.js').SchemaField<import('./types.js').DataType>
					>
				)[p.key];
				if (!schema) {
					throw new Error(
						`Predicate key '${p.key}' not found on component ${p.component.id}`,
					);
				}
				const t = schema.type as Types;
				// Validate operator applicability
				switch (p.op) {
					case 'lt':
					case 'le':
					case 'gt':
					case 'ge':
						if (
							!(
								t === Types.Int8 ||
								t === Types.Int16 ||
								t === Types.Int32 ||
								t === Types.Float32 ||
								t === Types.Float64
							)
						) {
							throw new Error(
								`Operator '${p.op}' only valid for numeric fields: ${p.component.id}.${p.key}`,
							);
						}
						break;
					case 'in':
					case 'nin':
						if (!Array.isArray(p.value)) {
							throw new Error(
								`Operator '${p.op}' requires array value for ${p.component.id}.${p.key}`,
							);
						}
						break;
					default:
						// eq, ne valid for all
						break;
				}
				const np: ValuePredicate & { valueSet?: Set<unknown> } = { ...p };
				if (p.op === 'in' || p.op === 'nin') {
					np.valueSet = new Set(p.value as unknown[]);
				}
				return np;
			});
		for (const p of preds) {
			requiredMask.orInPlace(p.component.bitmask!);
		}
		const whereStr = preds
			.map(
				(p) =>
					`${p.component.typeId}:${p.key}:${p.op}=${Array.isArray(p.value) ? 'arr' : String(p.value)}`,
			)
			.join(',');
		return {
			requiredMask,
			excludedMask,
			queryId: `required:${requiredMask.toString()}|excluded:${excludedMask.toString()}|where:${whereStr}`,
			valuePredicates: preds,
		};
	}
}

/**
 * Query Debugger - understand why entities match or don't match queries
 */

/* eslint-disable @typescript-eslint/no-explicit-any */

import type { Entity } from '../entity.js';
import type { Query } from '../query.js';
import type { World } from '../world.js';
import type {
	QueryDebugger,
	QueryInfo,
	PredicateInfo,
	MatchExplanation,
	MismatchReason,
	QueryEvent,
	Unsubscribe,
} from './types.js';

export function createQueryDebugger(
	world: World,
	getFrameCount: () => number,
): QueryDebugger {
	// Access the query manager's internal queries map
	const queryManager = world.queryManager;

	function getQueriesMap(): Map<string, Query> {
		return (queryManager as any).queries as Map<string, Query>;
	}

	function getQueryPredicates(query: Query): PredicateInfo[] {
		const predicates = (query as any).valuePredicates as Array<{
			component: { id: string };
			key: string;
			op: string;
			value: unknown;
		}>;

		return predicates.map((p) => ({
			componentId: p.component.id,
			key: p.key,
			operator: p.op,
			value: p.value,
		}));
	}

	function getRequiredComponentIds(query: Query): string[] {
		// We need to reverse-lookup components from the bitmask
		// This is tricky because we don't have direct access to component->mask mapping
		// For now, we'll access the component manager
		const componentManager = world.componentManager;

		const componentsByTypeId = (componentManager as any)
			.componentsByTypeId as Array<{
			id: string;
			bitmask: any;
			typeId: number;
		}>;

		const required: string[] = [];
		if (componentsByTypeId) {
			for (const comp of componentsByTypeId) {
				if (
					comp &&
					comp.bitmask &&
					(query.requiredMask as any).contains(comp.bitmask)
				) {
					required.push(comp.id);
				}
			}
		}
		return required;
	}

	function getExcludedComponentIds(query: Query): string[] {
		const componentManager = world.componentManager;

		const componentsByTypeId = (componentManager as any)
			.componentsByTypeId as Array<{
			id: string;
			bitmask: any;
			typeId: number;
		}>;

		const excluded: string[] = [];
		if (componentsByTypeId && !query.excludedMask.isEmpty()) {
			for (const comp of componentsByTypeId) {
				if (
					comp &&
					comp.bitmask &&
					(query.excludedMask as any).intersects(comp.bitmask)
				) {
					excluded.push(comp.id);
				}
			}
		}
		return excluded;
	}

	return {
		list(): QueryInfo[] {
			const queries = getQueriesMap();
			const result: QueryInfo[] = [];

			for (const [id, query] of queries) {
				result.push({
					id,
					required: getRequiredComponentIds(query),
					excluded: getExcludedComponentIds(query),
					predicates: getQueryPredicates(query),
					entityCount: query.entities.size,
				});
			}

			return result;
		},

		explainMatch(entity: Entity, query: Query): MatchExplanation {
			const componentManager = world.componentManager;

			const componentsByTypeId = (componentManager as any)
				.componentsByTypeId as Array<{
				id: string;
				bitmask: any;
			}>;

			// Check required components
			const requiredDetails: { componentId: string; hasIt: boolean }[] = [];
			let requiredPassed = true;

			if (componentsByTypeId) {
				for (const comp of componentsByTypeId) {
					if (
						comp &&
						comp.bitmask &&
						(query.requiredMask as any).contains(comp.bitmask)
					) {
						const hasIt = entity.hasComponent(comp as any);
						requiredDetails.push({ componentId: comp.id, hasIt });
						if (!hasIt) {
							requiredPassed = false;
						}
					}
				}
			}

			// Check excluded components
			const excludedDetails: { componentId: string; hasIt: boolean }[] = [];
			let excludedPassed = true;

			if (componentsByTypeId && !query.excludedMask.isEmpty()) {
				for (const comp of componentsByTypeId) {
					if (
						comp &&
						comp.bitmask &&
						(query.excludedMask as any).intersects(comp.bitmask)
					) {
						const hasIt = entity.hasComponent(comp as any);
						excludedDetails.push({ componentId: comp.id, hasIt });
						if (hasIt) {
							excludedPassed = false;
						}
					}
				}
			}

			// Check value predicates

			const predicates = (query as any).valuePredicates as Array<{
				component: { id: string };
				key: string;
				op: string;
				value: unknown;
				valueSet?: Set<unknown>;
			}>;

			const predicateDetails: {
				componentId: string;
				key: string;
				operator: string;
				expected: unknown;
				actual: unknown;
				passed: boolean;
			}[] = [];
			let predicatesPassed = true;

			for (const p of predicates) {
				let actual: unknown;
				try {
					actual = entity.getValue(p.component as any, p.key);
				} catch {
					actual = undefined;
				}

				let passed = false;
				switch (p.op) {
					case 'eq':
						passed = actual === p.value;
						break;
					case 'ne':
						passed = actual !== p.value;
						break;
					case 'lt':
						passed =
							typeof actual === 'number' &&
							typeof p.value === 'number' &&
							actual < p.value;
						break;
					case 'le':
						passed =
							typeof actual === 'number' &&
							typeof p.value === 'number' &&
							actual <= p.value;
						break;
					case 'gt':
						passed =
							typeof actual === 'number' &&
							typeof p.value === 'number' &&
							actual > p.value;
						break;
					case 'ge':
						passed =
							typeof actual === 'number' &&
							typeof p.value === 'number' &&
							actual >= p.value;
						break;
					case 'in':
						passed = p.valueSet ? p.valueSet.has(actual) : false;
						break;
					case 'nin':
						passed = p.valueSet ? !p.valueSet.has(actual) : true;
						break;
				}

				predicateDetails.push({
					componentId: p.component.id,
					key: p.key,
					operator: p.op,
					expected: p.value,
					actual,
					passed,
				});

				if (!passed) {
					predicatesPassed = false;
				}
			}

			return {
				matches: requiredPassed && excludedPassed && predicatesPassed,
				requiredCheck: { passed: requiredPassed, details: requiredDetails },
				excludedCheck: { passed: excludedPassed, details: excludedDetails },
				predicateCheck: { passed: predicatesPassed, details: predicateDetails },
			};
		},

		whyNotMatching(entity: Entity, query: Query): MismatchReason[] {
			const explanation = this.explainMatch(entity, query);
			const reasons: MismatchReason[] = [];

			// Missing required components
			for (const detail of explanation.requiredCheck.details) {
				if (!detail.hasIt) {
					reasons.push({
						type: 'missing_required',
						componentId: detail.componentId,
						message: `Entity is missing required component '${detail.componentId}'`,
						suggestion: `Add the component: entity.addComponent(${detail.componentId})`,
					});
				}
			}

			// Has excluded components
			for (const detail of explanation.excludedCheck.details) {
				if (detail.hasIt) {
					reasons.push({
						type: 'has_excluded',
						componentId: detail.componentId,
						message: `Entity has excluded component '${detail.componentId}'`,
						suggestion: `Remove the component: entity.removeComponent(${detail.componentId})`,
					});
				}
			}

			// Failed predicates
			for (const detail of explanation.predicateCheck.details) {
				if (!detail.passed) {
					let message: string;
					let suggestion: string;

					switch (detail.operator) {
						case 'eq':
							message = `${detail.componentId}.${detail.key} is ${detail.actual}, expected ${detail.expected}`;
							suggestion = `Set value to ${detail.expected}`;
							break;
						case 'ne':
							message = `${detail.componentId}.${detail.key} is ${detail.actual}, should not equal ${detail.expected}`;
							suggestion = `Change value to something other than ${detail.expected}`;
							break;
						case 'lt':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) is not < ${detail.expected}`;
							suggestion = `Set value to less than ${detail.expected}`;
							break;
						case 'le':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) is not <= ${detail.expected}`;
							suggestion = `Set value to ${detail.expected} or less`;
							break;
						case 'gt':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) is not > ${detail.expected}`;
							suggestion = `Set value to greater than ${detail.expected}`;
							break;
						case 'ge':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) is not >= ${detail.expected}`;
							suggestion = `Set value to ${detail.expected} or greater`;
							break;
						case 'in':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) is not in ${JSON.stringify(detail.expected)}`;
							suggestion = `Set value to one of: ${JSON.stringify(detail.expected)}`;
							break;
						case 'nin':
							message = `${detail.componentId}.${detail.key} (${detail.actual}) should not be in ${JSON.stringify(detail.expected)}`;
							suggestion = `Change value to something not in ${JSON.stringify(detail.expected)}`;
							break;
						default:
							message = `Predicate ${detail.operator} failed for ${detail.componentId}.${detail.key}`;
							suggestion = `Check the predicate condition`;
					}

					reasons.push({
						type: 'predicate_failed',
						componentId: detail.componentId,
						message,
						suggestion,
					});
				}
			}

			return reasons;
		},

		track(query: Query, callback: (event: QueryEvent) => void): Unsubscribe {
			const qualifyUnsub = query.subscribe('qualify', (entity) => {
				callback({
					type: 'qualify',
					entity,
					frame: getFrameCount(),
					timestamp: performance.now(),
				});
			});

			const disqualifyUnsub = query.subscribe('disqualify', (entity) => {
				callback({
					type: 'disqualify',
					entity,
					frame: getFrameCount(),
					timestamp: performance.now(),
				});
			});

			return () => {
				qualifyUnsub();
				disqualifyUnsub();
			};
		},
	};
}

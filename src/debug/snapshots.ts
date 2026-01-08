/**
 * Snapshot Manager - capture and restore world state
 */

import { ComponentRegistry } from '../component.js';
import type { Entity } from '../entity.js';
import type { World } from '../world.js';
import type { AnyComponent } from '../types.js';
import type {
	SnapshotManager,
	Snapshot,
	SnapshotInfo,
	SerializedEntity,
	WorldDiff,
} from './types.js';

export function createSnapshotManager(
	world: World,
	getFrameCount: () => number,
	maxSnapshots: number,
): SnapshotManager {
	const snapshots = new Map<string, Snapshot>();
	let autoCapture: { interval: number; maxSnapshots: number } | null = null;
	let lastAutoCaptureFrame = -1;

	function generateId(): string {
		return `snap_${Date.now()}_${Math.random().toString(36).slice(2, 9)}`;
	}

	function getAllActiveEntities(): Entity[] {
		const entities: Entity[] = [];
		const entityManager = world.entityManager;
		// eslint-disable-next-line @typescript-eslint/no-explicit-any
		const indexLookup = (entityManager as any).indexLookup as (Entity | null)[];

		if (indexLookup) {
			for (const entity of indexLookup) {
				if (entity && entity.active) {
					entities.push(entity);
				}
			}
		}

		return entities;
	}

	function serializeComponentValues(
		entity: Entity,
		component: AnyComponent,
	): Record<string, unknown> {
		const values: Record<string, unknown> = {};

		for (const key of Object.keys(component.schema)) {
			try {
				const value = entity.getValue(component, key);
				// Deep clone to avoid reference issues
				if (Array.isArray(value)) {
					values[key] = [...value];
				} else if (value !== null && typeof value === 'object') {
					values[key] = JSON.parse(JSON.stringify(value));
				} else {
					values[key] = value;
				}
			} catch {
				// Component might have issues, skip this field
			}
		}

		return values;
	}

	function serializeEntity(entity: Entity): SerializedEntity {
		const components = entity.getComponents();
		const serializedComponents: {
			id: string;
			values: Record<string, unknown>;
		}[] = [];

		for (const component of components) {
			serializedComponents.push({
				id: component.id,
				values: serializeComponentValues(entity, component),
			});
		}

		return {
			index: entity.index,
			generation: entity.generation,
			components: serializedComponents,
		};
	}

	function enforceMaxSnapshots(): void {
		if (snapshots.size > maxSnapshots) {
			// Remove oldest snapshots (by timestamp)
			const sorted = [...snapshots.entries()].sort(
				(a, b) => a[1].timestamp - b[1].timestamp,
			);
			while (snapshots.size > maxSnapshots) {
				const oldest = sorted.shift();
				if (oldest) {
					snapshots.delete(oldest[0]);
				}
			}
		}
	}

	// Auto-capture check - called by the debugger on each frame
	function checkAutoCapture(): void {
		if (!autoCapture) {
			return;
		}

		const currentFrame = getFrameCount();
		if (currentFrame - lastAutoCaptureFrame >= autoCapture.interval) {
			lastAutoCaptureFrame = currentFrame;

			// Use auto-capture's maxSnapshots if specified
			/* istanbul ignore next -- defensive: enableAutoCapture always sets maxSnapshots */
			const max = autoCapture.maxSnapshots ?? maxSnapshots;
			const autoSnaps = [...snapshots.entries()]
				.filter(([, s]) => s.label?.startsWith('auto_'))
				.sort((a, b) => a[1].timestamp - b[1].timestamp);

			// Remove old auto-snapshots if we have too many
			while (autoSnaps.length >= max) {
				const oldest = autoSnaps.shift();
				if (oldest) {
					snapshots.delete(oldest[0]);
				}
			}

			// Capture new auto-snapshot
			const snap = captureInternal(`auto_frame_${currentFrame}`);
			snapshots.set(snap.id, snap);
		}
	}

	function captureInternal(label?: string): Snapshot {
		const entities = getAllActiveEntities();
		const serializedEntities = entities.map((e) => serializeEntity(e));

		return {
			id: generateId(),
			label,
			frame: getFrameCount(),
			timestamp: performance.now(),
			entityCount: entities.length,
			entities: serializedEntities,
			globals: JSON.parse(JSON.stringify(world.globals)),
		};
	}

	return {
		capture(label?: string): Snapshot {
			const snapshot = captureInternal(label);
			snapshots.set(snapshot.id, snapshot);
			enforceMaxSnapshots();
			return snapshot;
		},

		restore(snapshot: Snapshot): void {
			// First, destroy all current entities
			const currentEntities = getAllActiveEntities();
			for (const entity of currentEntities) {
				entity.destroy();
			}

			// Clear globals and restore from snapshot
			for (const key of Object.keys(world.globals)) {
				delete world.globals[key];
			}
			Object.assign(
				world.globals,
				JSON.parse(JSON.stringify(snapshot.globals)),
			);

			// Recreate entities from snapshot
			for (const serialized of snapshot.entities) {
				const entity = world.createEntity();

				for (const compData of serialized.components) {
					const component = ComponentRegistry.getById(compData.id);
					if (component) {
						entity.addComponent(component, compData.values);
					}
				}
			}
		},

		list(): SnapshotInfo[] {
			return [...snapshots.values()].map((s) => ({
				id: s.id,
				label: s.label,
				frame: s.frame,
				timestamp: s.timestamp,
				entityCount: s.entityCount,
			}));
		},

		get(id: string): Snapshot | undefined {
			return snapshots.get(id);
		},

		delete(id: string): void {
			snapshots.delete(id);
		},

		clear(): void {
			snapshots.clear();
		},

		diff(before: Snapshot, after: Snapshot): WorldDiff {
			const beforeEntityMap = new Map<number, SerializedEntity>();
			const afterEntityMap = new Map<number, SerializedEntity>();

			for (const e of before.entities) {
				beforeEntityMap.set(e.index, e);
			}
			for (const e of after.entities) {
				afterEntityMap.set(e.index, e);
			}

			const entitiesCreated: number[] = [];
			const entitiesDestroyed: number[] = [];
			const componentsAdded: { entityIndex: number; componentId: string }[] =
				[];
			const componentsRemoved: { entityIndex: number; componentId: string }[] =
				[];
			const valuesChanged: {
				entityIndex: number;
				componentId: string;
				key: string;
				before: unknown;
				after: unknown;
			}[] = [];

			// Find created entities (in after but not in before)
			for (const [index] of afterEntityMap) {
				if (!beforeEntityMap.has(index)) {
					entitiesCreated.push(index);
				}
			}

			// Find destroyed entities (in before but not in after)
			for (const [index] of beforeEntityMap) {
				if (!afterEntityMap.has(index)) {
					entitiesDestroyed.push(index);
				}
			}

			// Compare entities that exist in both
			for (const [index, beforeEntity] of beforeEntityMap) {
				const afterEntity = afterEntityMap.get(index);
				if (!afterEntity) {
					continue;
				}

				const beforeComps = new Map<string, Record<string, unknown>>();
				const afterComps = new Map<string, Record<string, unknown>>();

				for (const c of beforeEntity.components) {
					beforeComps.set(c.id, c.values);
				}
				for (const c of afterEntity.components) {
					afterComps.set(c.id, c.values);
				}

				// Find added components
				for (const [compId] of afterComps) {
					if (!beforeComps.has(compId)) {
						componentsAdded.push({ entityIndex: index, componentId: compId });
					}
				}

				// Find removed components
				for (const [compId] of beforeComps) {
					if (!afterComps.has(compId)) {
						componentsRemoved.push({ entityIndex: index, componentId: compId });
					}
				}

				// Find changed values
				for (const [compId, beforeValues] of beforeComps) {
					const afterValues = afterComps.get(compId);
					if (!afterValues) {
						continue;
					}

					for (const key of Object.keys(beforeValues)) {
						const beforeVal = beforeValues[key];
						const afterVal = afterValues[key];

						// Simple equality check (handles primitives and arrays)
						const beforeStr = JSON.stringify(beforeVal);
						const afterStr = JSON.stringify(afterVal);

						if (beforeStr !== afterStr) {
							valuesChanged.push({
								entityIndex: index,
								componentId: compId,
								key,
								before: beforeVal,
								after: afterVal,
							});
						}
					}

					// Check for new keys in after
					for (const key of Object.keys(afterValues)) {
						if (!(key in beforeValues)) {
							valuesChanged.push({
								entityIndex: index,
								componentId: compId,
								key,
								before: undefined,
								after: afterValues[key],
							});
						}
					}
				}
			}

			return {
				entitiesCreated,
				entitiesDestroyed,
				componentsAdded,
				componentsRemoved,
				valuesChanged,
			};
		},

		enableAutoCapture(options: {
			interval?: number;
			maxSnapshots?: number;
		}): void {
			autoCapture = {
				interval: options.interval ?? 60,
				maxSnapshots: options.maxSnapshots ?? maxSnapshots,
			};
			lastAutoCaptureFrame = getFrameCount();
		},

		disableAutoCapture(): void {
			autoCapture = null;
		},

		// Internal: called by debugger on each frame
		_checkAutoCapture: checkAutoCapture,
	} as SnapshotManager & { _checkAutoCapture: () => void };
}

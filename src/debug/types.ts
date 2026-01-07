/**
 * Core types for the elics ECS debugger
 */

import type { Entity } from '../entity.js';
import type { Query } from '../query.js';
import type { AnySystem, AnyComponent } from '../types.js';

// ============================================================================
// Debugger Options & Main Interface
// ============================================================================

export interface DebuggerOptions {
	/** Enable system profiling on attach. Default: false */
	enableProfiling?: boolean;
	/** Enable event timeline recording on attach. Default: false */
	enableTimeline?: boolean;
	/** Maximum snapshots to keep. Default: 50 */
	maxSnapshots?: number;
	/** Maximum timeline events to keep. Default: 10000 */
	maxTimelineEvents?: number;
	/** Number of frames to keep in profiling history. Default: 1000 */
	profilingHistorySize?: number;
}

export type DebugEventType =
	| 'pause'
	| 'resume'
	| 'step'
	| 'frameComplete'
	| 'performanceAlert';

export type DebugEventCallback<T = unknown> = (data: T) => void;

export interface DebugEventData {
	pause: { frame: number };
	resume: { frame: number };
	step: { frames: number; frame: number };
	frameComplete: { frame: number; delta: number; time: number };
	performanceAlert: { systemName: string; time: number; threshold: number };
}

export type Unsubscribe = () => void;

// ============================================================================
// Entity Inspector Types
// ============================================================================

export interface ComponentSnapshot {
	id: string;
	description?: string;
	values: Record<string, unknown>;
}

export interface EntitySnapshot {
	index: number;
	generation: number;
	active: boolean;
	components: ComponentSnapshot[];
}

export interface EntityInspector {
	/** Get snapshot of a single entity */
	entity(entity: Entity): EntitySnapshot;
	/** Get snapshots of all active entities */
	entities(): EntitySnapshot[];
	/** Find entities that have a specific component */
	entitiesByComponent(component: AnyComponent): Entity[];
	/** Watch an entity for changes */
	watch(
		entity: Entity,
		callback: (snapshot: EntitySnapshot) => void,
	): Unsubscribe;
	/** Set a component value on an entity (for debugging) */
	setValue<C extends AnyComponent>(
		entity: Entity,
		component: C,
		key: string,
		value: unknown,
	): void;
}

// ============================================================================
// System Profiler Types
// ============================================================================

export interface SystemMetrics {
	name: string;
	priority: number;
	isPaused: boolean;
	/** Last update time in milliseconds */
	lastTime: number;
	/** Average update time in milliseconds */
	avgTime: number;
	/** Minimum update time in milliseconds */
	minTime: number;
	/** Maximum update time in milliseconds */
	maxTime: number;
	/** Total number of update calls */
	updateCount: number;
}

export interface SystemProfiler {
	/** Enable profiling (patches system.update methods) */
	enable(): void;
	/** Disable profiling (restores original methods) */
	disable(): void;
	/** Check if profiling is enabled */
	isEnabled(): boolean;
	/** Get metrics for all systems */
	getMetrics(): SystemMetrics[];
	/** Get metrics for a specific system */
	getMetricsFor(system: AnySystem): SystemMetrics | undefined;
	/** Set performance alert threshold for a system */
	setThreshold(systemName: string, maxMs: number): void;
	/** Clear performance alert threshold for a system */
	clearThreshold(systemName: string): void;
	/** Reset all collected metrics */
	reset(): void;
}

// ============================================================================
// Query Debugger Types
// ============================================================================

export interface PredicateInfo {
	componentId: string;
	key: string;
	operator: string;
	value: unknown;
}

export interface QueryInfo {
	id: string;
	required: string[];
	excluded: string[];
	predicates: PredicateInfo[];
	entityCount: number;
}

export interface MatchExplanation {
	matches: boolean;
	requiredCheck: {
		passed: boolean;
		details: { componentId: string; hasIt: boolean }[];
	};
	excludedCheck: {
		passed: boolean;
		details: { componentId: string; hasIt: boolean }[];
	};
	predicateCheck: {
		passed: boolean;
		details: {
			componentId: string;
			key: string;
			operator: string;
			expected: unknown;
			actual: unknown;
			passed: boolean;
		}[];
	};
}

export interface MismatchReason {
	type: 'missing_required' | 'has_excluded' | 'predicate_failed';
	componentId: string;
	message: string;
	suggestion: string;
}

export interface QueryEvent {
	type: 'qualify' | 'disqualify';
	entity: Entity;
	frame: number;
	timestamp: number;
}

export interface QueryDebugger {
	/** List all registered queries */
	list(): QueryInfo[];
	/** Explain why an entity does or doesn't match a query */
	explainMatch(entity: Entity, query: Query): MatchExplanation;
	/** Get reasons why an entity doesn't match a query */
	whyNotMatching(entity: Entity, query: Query): MismatchReason[];
	/** Track query qualify/disqualify events */
	track(query: Query, callback: (event: QueryEvent) => void): Unsubscribe;
}

// ============================================================================
// Snapshot Types
// ============================================================================

export interface SerializedEntity {
	index: number;
	generation: number;
	components: {
		id: string;
		values: Record<string, unknown>;
	}[];
}

export interface Snapshot {
	id: string;
	label?: string;
	frame: number;
	timestamp: number;
	entityCount: number;
	entities: SerializedEntity[];
	globals: Record<string, unknown>;
}

export interface SnapshotInfo {
	id: string;
	label?: string;
	frame: number;
	timestamp: number;
	entityCount: number;
}

export interface WorldDiff {
	entitiesCreated: number[];
	entitiesDestroyed: number[];
	componentsAdded: { entityIndex: number; componentId: string }[];
	componentsRemoved: { entityIndex: number; componentId: string }[];
	valuesChanged: {
		entityIndex: number;
		componentId: string;
		key: string;
		before: unknown;
		after: unknown;
	}[];
}

export interface SnapshotManager {
	/** Capture current world state */
	capture(label?: string): Snapshot;
	/** Restore world to a previous snapshot */
	restore(snapshot: Snapshot): void;
	/** List all stored snapshots */
	list(): SnapshotInfo[];
	/** Get a snapshot by ID */
	get(id: string): Snapshot | undefined;
	/** Delete a snapshot by ID */
	delete(id: string): void;
	/** Clear all snapshots */
	clear(): void;
	/** Compare two snapshots */
	diff(before: Snapshot, after: Snapshot): WorldDiff;
	/** Enable auto-capture every N frames */
	enableAutoCapture(options: {
		interval?: number;
		maxSnapshots?: number;
	}): void;
	/** Disable auto-capture */
	disableAutoCapture(): void;
}

// ============================================================================
// Timeline Types
// ============================================================================

export type TimelineEventType =
	| 'entityCreated'
	| 'entityDestroyed'
	| 'componentAdded'
	| 'componentRemoved'
	| 'valueChanged'
	| 'queryQualify'
	| 'queryDisqualify';

export interface TimelineEvent {
	type: TimelineEventType;
	frame: number;
	timestamp: number;
	entityIndex: number;
	componentId?: string;
	details?: Record<string, unknown>;
}

export interface EventFilter {
	types?: TimelineEventType[];
	entityIndex?: number;
	componentId?: string;
	frameRange?: { start: number; end: number };
	limit?: number;
}

export interface TimelineStats {
	totalEvents: number;
	framesRecorded: number;
	entitiesCreated: number;
	entitiesDestroyed: number;
	componentAdds: number;
	componentRemoves: number;
	valueChanges: number;
}

export interface EventTimeline {
	/** Start recording events */
	startRecording(): void;
	/** Stop recording events */
	stopRecording(): void;
	/** Check if recording is active */
	isRecording(): boolean;
	/** Get events matching filter */
	getEvents(filter?: EventFilter): TimelineEvent[];
	/** Get timeline statistics */
	getStats(): TimelineStats;
	/** Clear all recorded events */
	clear(): void;
	/** Export events as JSON string */
	export(): string;
}

// ============================================================================
// Main Debugger Interface
// ============================================================================

export interface Debugger {
	// Execution control
	readonly isPaused: boolean;
	readonly frameCount: number;
	pause(): void;
	resume(): void;
	step(frames?: number): void;

	// Sub-modules
	readonly inspect: EntityInspector;
	readonly profiler: SystemProfiler;
	readonly queries: QueryDebugger;
	readonly snapshots: SnapshotManager;
	readonly timeline: EventTimeline;

	// Events
	on<E extends DebugEventType>(
		event: E,
		callback: DebugEventCallback<DebugEventData[E]>,
	): Unsubscribe;

	// Lifecycle
	detach(): void;
}

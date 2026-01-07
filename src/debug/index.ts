/**
 * elics ECS Debugger
 *
 * Usage:
 * ```typescript
 * import { World } from 'elics';
 * import { attachDebugger } from 'elics/debug';
 *
 * const world = new World();
 * const debug = attachDebugger(world);
 *
 * // Pause/resume/step
 * debug.pause();
 * debug.step();
 * debug.resume();
 *
 * // Inspect entities
 * debug.inspect.entities();
 *
 * // Profile systems
 * debug.profiler.enable();
 * debug.profiler.getMetrics();
 *
 * // Debug queries
 * debug.queries.explainMatch(entity, query);
 *
 * // Snapshots
 * const snap = debug.snapshots.capture('before-bug');
 * debug.snapshots.restore(snap);
 *
 * // Timeline
 * debug.timeline.startRecording();
 * debug.timeline.getEvents({ entityIndex: 5 });
 *
 * // Cleanup
 * debug.detach();
 * ```
 */

export { attachDebugger } from './debugger.js';

// Re-export types
export type {
	Debugger,
	DebuggerOptions,
	DebugEventType,
	DebugEventData,
	DebugEventCallback,
	Unsubscribe,
	// Entity Inspector
	EntityInspector,
	EntitySnapshot,
	ComponentSnapshot,
	// System Profiler
	SystemProfiler,
	SystemMetrics,
	// Query Debugger
	QueryDebugger,
	QueryInfo,
	PredicateInfo,
	MatchExplanation,
	MismatchReason,
	QueryEvent,
	// Snapshots
	SnapshotManager,
	Snapshot,
	SnapshotInfo,
	SerializedEntity,
	WorldDiff,
	// Timeline
	EventTimeline,
	TimelineEvent,
	TimelineEventType,
	EventFilter,
	TimelineStats,
} from './types.js';

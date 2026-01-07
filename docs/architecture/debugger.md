---
outline: deep
---

# Debugger

The **Debugger** module in EliCS provides comprehensive debugging and profiling capabilities for ECS applications. It allows developers to pause execution, step through frames, inspect entities, profile system performance, understand query matching, capture world state snapshots, and record event timelines.

## Features

- **Execution Control**: Pause, resume, and step through world updates frame by frame.
- **Entity Inspection**: View detailed snapshots of entities and their component data in real-time.
- **System Profiling**: Measure system update performance with timing metrics and alerts.
- **Query Debugging**: Understand why entities match or don't match specific queries.
- **State Snapshots**: Capture and restore world state, compare differences between states.
- **Event Timeline**: Record and analyze entity lifecycle events over time.

## Implementation Overview

The debugger attaches to a `World` instance by patching its `update` method, enabling execution control without modifying your application code. Each debugging capability is implemented as a separate sub-module:

- **Entity Inspector**: Provides read/write access to entity component data through a consistent snapshot interface.
- **System Profiler**: Wraps system `update` methods to collect timing metrics with configurable history size.
- **Query Debugger**: Analyzes query predicates and component masks to explain entity matching behavior.
- **Snapshot Manager**: Serializes world state including entities, components, and globals for capture/restore functionality.
- **Event Timeline**: Records lifecycle events with frame numbers and timestamps for post-analysis.

## Usage

### Basic Setup

Import the debugger and attach it to your world:

```ts
import { World } from 'elics';
import { attachDebugger } from 'elics/debug';

const world = new World();
// Register your components and systems...

const debug = attachDebugger(world, {
	enableProfiling: true,
	enableTimeline: true,
});
```

### Execution Control

Control world execution for debugging:

```ts
// Pause the world - updates will be skipped
debug.pause();

// Step forward one frame while paused
debug.step();

// Step forward multiple frames
debug.step(5);

// Resume normal execution
debug.resume();

// Check current state
console.log(`Frame: ${debug.frameCount}, Paused: ${debug.isPaused}`);
```

### Entity Inspection

Inspect entities and their component data:

```ts
// Get a snapshot of all entities
const entities = debug.inspect.entities();
entities.forEach((snapshot) => {
	console.log(`Entity ${snapshot.index}:`, snapshot.components);
});

// Inspect a specific entity
const entity = world.createEntity();
entity.addComponent(Position, { x: 100, y: 200 });
const snapshot = debug.inspect.entity(entity);
console.log(snapshot.components[0].values); // { x: 100, y: 200 }

// Find entities with a specific component
const withPosition = debug.inspect.entitiesByComponent(Position);

// Watch an entity for changes
const unwatch = debug.inspect.watch(entity, (snapshot) => {
	console.log('Entity changed:', snapshot);
});
// Later: unwatch();

// Modify entity values for debugging
debug.inspect.setValue(entity, Position, 'x', 500);
```

### System Profiling

Profile system performance:

```ts
// Enable profiling
debug.profiler.enable();

// Run some frames
for (let i = 0; i < 100; i++) {
	world.update(1 / 60, performance.now());
}

// Get metrics for all systems
const metrics = debug.profiler.getMetrics();
metrics.forEach((m) => {
	console.log(
		`${m.name}: avg=${m.avgTime.toFixed(2)}ms, max=${m.maxTime.toFixed(2)}ms`,
	);
});

// Set performance alert threshold
debug.profiler.setThreshold('PhysicsSystem', 5); // Alert if > 5ms

// Listen for performance alerts
debug.on('performanceAlert', ({ systemName, time, threshold }) => {
	console.warn(
		`${systemName} took ${time.toFixed(2)}ms (threshold: ${threshold}ms)`,
	);
});

// Disable when done
debug.profiler.disable();
```

### Query Debugging

Understand why entities match or don't match queries:

```ts
// List all registered queries
const queries = debug.queries.list();
queries.forEach((q) => {
	console.log(`Query ${q.id}: ${q.entityCount} entities`);
	console.log('  Required:', q.required);
	console.log('  Excluded:', q.excluded);
	console.log('  Predicates:', q.predicates);
});

// Get a query from a system
const movementSystem = world.getSystem(MovementSystem);
const movingQuery = movementSystem.queries.moving;

// Explain why an entity matches (or doesn't match) a query
const explanation = debug.queries.explainMatch(entity, movingQuery);
console.log('Matches:', explanation.matches);
console.log('Required check:', explanation.requiredCheck);
console.log('Excluded check:', explanation.excludedCheck);
console.log('Predicate check:', explanation.predicateCheck);

// Get specific reasons why an entity doesn't match
const reasons = debug.queries.whyNotMatching(entity, movingQuery);
reasons.forEach((reason) => {
	console.log(`❌ ${reason.message}`);
	console.log(`   Suggestion: ${reason.suggestion}`);
});

// Track query changes
const untrack = debug.queries.track(movingQuery, (event) => {
	console.log(
		`Entity ${event.entity.index} ${event.type}d query at frame ${event.frame}`,
	);
});
// Later: untrack();
```

### State Snapshots

Capture and restore world state:

```ts
// Capture current state
const before = debug.snapshots.capture('before-changes');

// Make some changes
entity.setValue(Position, 'x', 999);
world.createEntity().addComponent(Velocity);

// Capture state after changes
const after = debug.snapshots.capture('after-changes');

// Compare snapshots
const diff = debug.snapshots.diff(before, after);
console.log('Created entities:', diff.entitiesCreated);
console.log('Destroyed entities:', diff.entitiesDestroyed);
console.log('Added components:', diff.componentsAdded);
console.log('Changed values:', diff.valuesChanged);

// Restore to previous state
debug.snapshots.restore(before);

// List all snapshots
const snapshots = debug.snapshots.list();
console.log(
	'Stored snapshots:',
	snapshots.map((s) => s.label),
);

// Enable auto-capture every 60 frames
debug.snapshots.enableAutoCapture({ interval: 60, maxSnapshots: 10 });

// Disable auto-capture
debug.snapshots.disableAutoCapture();
```

### Event Timeline

Record and analyze events:

```ts
// Start recording
debug.timeline.startRecording();

// Run your application
for (let i = 0; i < 100; i++) {
	world.update(1 / 60, performance.now());
}

// Get all events
const events = debug.timeline.getEvents();

// Filter events
const entityEvents = debug.timeline.getEvents({
	types: ['entityCreated', 'entityDestroyed'],
	entityIndex: 5,
	frameRange: { start: 10, end: 50 },
	limit: 100,
});

// Get statistics
const stats = debug.timeline.getStats();
console.log(
	`Recorded ${stats.totalEvents} events over ${stats.framesRecorded} frames`,
);
console.log(
	`Created: ${stats.entitiesCreated}, Destroyed: ${stats.entitiesDestroyed}`,
);

// Export for external analysis
const json = debug.timeline.export();
console.log(json);

// Stop recording
debug.timeline.stopRecording();
```

### Event Handling

Listen for debugger events:

```ts
// Frame completion
const unsubFrame = debug.on('frameComplete', ({ frame, delta, time }) => {
	console.log(`Frame ${frame} completed (delta: ${delta.toFixed(3)}s)`);
});

// Pause/resume events
debug.on('pause', ({ frame }) => console.log(`Paused at frame ${frame}`));
debug.on('resume', ({ frame }) => console.log(`Resumed at frame ${frame}`));
debug.on('step', ({ frames, frame }) =>
	console.log(`Stepping ${frames} frames from ${frame}`),
);

// Performance alerts
debug.on('performanceAlert', ({ systemName, time, threshold }) => {
	console.warn(`⚠️ ${systemName}: ${time.toFixed(2)}ms > ${threshold}ms`);
});
```

### Cleanup

Detach the debugger when done:

```ts
debug.detach();
// World is restored to original state
// All event listeners are removed
// Profiling is disabled
```

## API Documentation

### attachDebugger Function

Attaches a debugger to a world instance.

```ts
function attachDebugger(world: World, options?: DebuggerOptions): Debugger;
```

- **Parameters:**
  - `world`: The World instance to debug.
  - `options` (optional): Configuration options.
- **Returns:** A Debugger instance.

### DebuggerOptions

```ts
interface DebuggerOptions {
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
```

### Debugger.isPaused

Indicates whether the world is currently paused.

```ts
readonly isPaused: boolean;
```

### Debugger.frameCount

The current frame count since the debugger was attached.

```ts
readonly frameCount: number;
```

### Debugger.pause

Pauses world execution.

```ts
pause(): void;
```

### Debugger.resume

Resumes world execution.

```ts
resume(): void;
```

### Debugger.step

Steps forward a specified number of frames while paused.

```ts
step(frames?: number): void;
```

- **Parameters:**
  - `frames` (optional): Number of frames to step. Default: 1.

### Debugger.inspect

The entity inspector sub-module. See [EntityInspector](#entityinspector).

```ts
readonly inspect: EntityInspector;
```

### Debugger.profiler

The system profiler sub-module. See [SystemProfiler](#systemprofiler).

```ts
readonly profiler: SystemProfiler;
```

### Debugger.queries

The query debugger sub-module. See [QueryDebugger](#querydebugger).

```ts
readonly queries: QueryDebugger;
```

### Debugger.snapshots

The snapshot manager sub-module. See [SnapshotManager](#snapshotmanager).

```ts
readonly snapshots: SnapshotManager;
```

### Debugger.timeline

The event timeline sub-module. See [EventTimeline](#eventtimeline).

```ts
readonly timeline: EventTimeline;
```

### Debugger.on

Subscribe to debugger events.

```ts
on<E extends DebugEventType>(
  event: E,
  callback: (data: DebugEventData[E]) => void
): Unsubscribe;
```

- **Parameters:**
  - `event`: The event type ('pause', 'resume', 'step', 'frameComplete', 'performanceAlert').
  - `callback`: Function called when the event occurs.
- **Returns:** A function to unsubscribe.

### Debugger.detach

Detaches the debugger and restores the world to its original state.

```ts
detach(): void;
```

---

## EntityInspector

### EntityInspector.entity

Gets a snapshot of a single entity.

```ts
entity(entity: Entity): EntitySnapshot;
```

### EntityInspector.entities

Gets snapshots of all active entities.

```ts
entities(): EntitySnapshot[];
```

### EntityInspector.entitiesByComponent

Finds entities that have a specific component.

```ts
entitiesByComponent(component: AnyComponent): Entity[];
```

### EntityInspector.watch

Watches an entity for changes.

```ts
watch(entity: Entity, callback: (snapshot: EntitySnapshot) => void): Unsubscribe;
```

### EntityInspector.setValue

Sets a component value on an entity for debugging purposes.

```ts
setValue<C extends AnyComponent>(
  entity: Entity,
  component: C,
  key: string,
  value: unknown
): void;
```

---

## SystemProfiler

### SystemProfiler.enable

Enables profiling by patching system update methods.

```ts
enable(): void;
```

### SystemProfiler.disable

Disables profiling and restores original methods.

```ts
disable(): void;
```

### SystemProfiler.isEnabled

Checks if profiling is enabled.

```ts
isEnabled(): boolean;
```

### SystemProfiler.getMetrics

Gets metrics for all systems.

```ts
getMetrics(): SystemMetrics[];
```

### SystemProfiler.getMetricsFor

Gets metrics for a specific system.

```ts
getMetricsFor(system: AnySystem): SystemMetrics | undefined;
```

### SystemProfiler.setThreshold

Sets a performance alert threshold for a system.

```ts
setThreshold(systemName: string, maxMs: number): void;
```

### SystemProfiler.clearThreshold

Clears the performance alert threshold for a system.

```ts
clearThreshold(systemName: string): void;
```

### SystemProfiler.reset

Resets all collected metrics.

```ts
reset(): void;
```

### SystemMetrics

```ts
interface SystemMetrics {
	name: string;
	priority: number;
	isPaused: boolean;
	lastTime: number; // Last update time in ms
	avgTime: number; // Average update time in ms
	minTime: number; // Minimum update time in ms
	maxTime: number; // Maximum update time in ms
	updateCount: number;
}
```

---

## QueryDebugger

### QueryDebugger.list

Lists all registered queries.

```ts
list(): QueryInfo[];
```

### QueryDebugger.explainMatch

Explains why an entity does or doesn't match a query.

```ts
explainMatch(entity: Entity, query: Query): MatchExplanation;
```

### QueryDebugger.whyNotMatching

Gets reasons why an entity doesn't match a query.

```ts
whyNotMatching(entity: Entity, query: Query): MismatchReason[];
```

### QueryDebugger.track

Tracks query qualify/disqualify events.

```ts
track(query: Query, callback: (event: QueryEvent) => void): Unsubscribe;
```

### MatchExplanation

```ts
interface MatchExplanation {
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
```

### MismatchReason

```ts
interface MismatchReason {
	type: 'missing_required' | 'has_excluded' | 'predicate_failed';
	componentId: string;
	message: string;
	suggestion: string;
}
```

---

## SnapshotManager

### SnapshotManager.capture

Captures current world state.

```ts
capture(label?: string): Snapshot;
```

### SnapshotManager.restore

Restores world to a previous snapshot.

```ts
restore(snapshot: Snapshot): void;
```

### SnapshotManager.list

Lists all stored snapshots.

```ts
list(): SnapshotInfo[];
```

### SnapshotManager.get

Gets a snapshot by ID.

```ts
get(id: string): Snapshot | undefined;
```

### SnapshotManager.delete

Deletes a snapshot by ID.

```ts
delete(id: string): void;
```

### SnapshotManager.clear

Clears all snapshots.

```ts
clear(): void;
```

### SnapshotManager.diff

Compares two snapshots.

```ts
diff(before: Snapshot, after: Snapshot): WorldDiff;
```

### SnapshotManager.enableAutoCapture

Enables automatic snapshot capture at regular intervals.

```ts
enableAutoCapture(options: {
  interval?: number;      // Frames between captures. Default: 60
  maxSnapshots?: number;  // Max auto-snapshots to keep
}): void;
```

### SnapshotManager.disableAutoCapture

Disables automatic snapshot capture.

```ts
disableAutoCapture(): void;
```

### WorldDiff

```ts
interface WorldDiff {
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
```

---

## EventTimeline

### EventTimeline.startRecording

Starts recording events.

```ts
startRecording(): void;
```

### EventTimeline.stopRecording

Stops recording events.

```ts
stopRecording(): void;
```

### EventTimeline.isRecording

Checks if recording is active.

```ts
isRecording(): boolean;
```

### EventTimeline.getEvents

Gets events matching an optional filter.

```ts
getEvents(filter?: EventFilter): TimelineEvent[];
```

### EventTimeline.getStats

Gets timeline statistics.

```ts
getStats(): TimelineStats;
```

### EventTimeline.clear

Clears all recorded events.

```ts
clear(): void;
```

### EventTimeline.export

Exports events as a JSON string.

```ts
export(): string;
```

### EventFilter

```ts
interface EventFilter {
	types?: TimelineEventType[];
	entityIndex?: number;
	componentId?: string;
	frameRange?: { start: number; end: number };
	limit?: number;
}
```

### TimelineStats

```ts
interface TimelineStats {
	totalEvents: number;
	framesRecorded: number;
	entitiesCreated: number;
	entitiesDestroyed: number;
	componentAdds: number;
	componentRemoves: number;
	valueChanges: number;
}
```

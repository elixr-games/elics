# elics ECS Debugger Proposal

## Executive Summary

This proposal outlines a comprehensive debugging tool for the elics ECS framework. Based on research of industry best practices (Unity DOTS, Flecs Explorer, Unreal, Godot) and careful analysis of elics's architecture, I propose a modular debugger with the following core capabilities:

1. **Execution Control** - Pause, resume, step-by-step execution
2. **Entity Inspector** - Real-time component value inspection and editing
3. **System Profiler** - Performance monitoring and execution order visualization
4. **Query Debugger** - Query matching analysis and subscription event tracking
5. **State Snapshots** - Capture and restore world state for time-travel debugging
6. **Event Timeline** - Track entity lifecycle and component changes over time

---

## Architecture Overview

The debugger is designed as a **non-intrusive wrapper** around the World class that intercepts and monitors all ECS operations without modifying core elics code.

```
┌─────────────────────────────────────────────────────────────────┐
│                      DebuggerContext                            │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ ExecutionCtrl│  │ EntityInspect│  │ SystemProfiler        │ │
│  │ - pause()    │  │ - getState() │  │ - measureUpdate()     │ │
│  │ - resume()   │  │ - setValue() │  │ - getTimings()        │ │
│  │ - step()     │  │ - watch()    │  │ - visualize()         │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
│  ┌──────────────┐  ┌──────────────┐  ┌───────────────────────┐ │
│  │ QueryDebug   │  │ StateSnapsh  │  │ EventTimeline         │ │
│  │ - explain()  │  │ - capture()  │  │ - record()            │ │
│  │ - trace()    │  │ - restore()  │  │ - playback()          │ │
│  └──────────────┘  └──────────────┘  └───────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
                    ┌─────────────────┐
                    │   World (elics) │
                    └─────────────────┘
```

---

## Feature Specifications

### 1. Execution Control

**Purpose**: Control the ECS update loop for step-by-step debugging.

**API Design**:

```typescript
interface ExecutionController {
  // State
  readonly isPaused: boolean;
  readonly frameCount: number;
  readonly currentTime: number;

  // Control methods
  pause(): void;
  resume(): void;
  step(frames?: number): void;           // Step N frames (default: 1)
  stepSystem(system: AnySystem): void;   // Execute single system

  // Breakpoints
  setBreakpoint(condition: BreakpointCondition): Breakpoint;
  removeBreakpoint(breakpoint: Breakpoint): void;

  // Speed control
  setTimeScale(scale: number): void;     // 0.1 = 10x slower, 2 = 2x faster
}

type BreakpointCondition =
  | { type: 'frame'; frame: number }
  | { type: 'entityCreated'; filter?: (entity: Entity) => boolean }
  | { type: 'componentAdded'; component: AnyComponent }
  | { type: 'componentValueChanged'; component: AnyComponent; key: string }
  | { type: 'queryQualify'; query: Query }
  | { type: 'custom'; predicate: (world: World) => boolean };
```

**Implementation Strategy**:

The execution controller wraps `world.update()`:

```typescript
class DebugWorld {
  private paused = false;
  private pendingSteps = 0;

  update(delta: number, time: number): void {
    if (this.paused && this.pendingSteps <= 0) {
      return; // Skip update when paused
    }

    if (this.pendingSteps > 0) {
      this.pendingSteps--;
    }

    // Check breakpoints before each system
    for (const system of this.world.getSystems()) {
      if (this.checkBreakpoints()) {
        this.paused = true;
        this.emit('breakpointHit', { system, frame: this.frameCount });
        return;
      }

      if (!system.isPaused) {
        system.update(delta * this.timeScale, time);
      }
    }

    this.frameCount++;
  }
}
```

**elics-Specific Considerations**:
- elics already has `system.isPaused` - the debugger can leverage this for per-system pause
- The debugger intercepts `world.update()` rather than modifying it
- Breakpoints integrate with Query subscription events (`qualify`/`disqualify`)

---

### 2. Entity Inspector

**Purpose**: Inspect and modify entity state in real-time.

**API Design**:

```typescript
interface EntityInspector {
  // Inspection
  getEntityState(entity: Entity): EntitySnapshot;
  getAllEntities(): EntitySnapshot[];
  getEntitiesByComponent(component: AnyComponent): Entity[];

  // Watching
  watch(entity: Entity, callback: (snapshot: EntitySnapshot) => void): Unsubscribe;
  watchComponent<C extends AnyComponent>(
    entity: Entity,
    component: C,
    callback: (values: ComponentValues<C>) => void
  ): Unsubscribe;

  // Modification (debug only)
  setValue<C extends AnyComponent, K extends keyof C['schema']>(
    entity: Entity,
    component: C,
    key: K,
    value: TypeValueToType<C['schema'][K]>
  ): void;

  // Search
  findEntities(predicate: (entity: Entity) => boolean): Entity[];
  queryEntities(config: QueryConfig): Entity[];
}

interface EntitySnapshot {
  entity: Entity;
  index: number;
  generation: number;
  active: boolean;
  components: ComponentSnapshot[];
  bitmask: string; // Binary representation
}

interface ComponentSnapshot {
  component: AnyComponent;
  id: string;
  description?: string;
  values: Record<string, unknown>;
}
```

**Implementation Strategy**:

```typescript
class EntityInspector {
  getEntityState(entity: Entity): EntitySnapshot {
    const components = entity.getComponents();

    return {
      entity,
      index: entity.index,
      generation: entity.generation,
      active: entity.active,
      bitmask: entity.bitmask.toString(),
      components: components.map(comp => ({
        component: comp,
        id: comp.id,
        description: comp.description,
        values: this.extractComponentValues(entity, comp)
      }))
    };
  }

  private extractComponentValues(entity: Entity, component: AnyComponent): Record<string, unknown> {
    const values: Record<string, unknown> = {};
    for (const key of Object.keys(component.schema)) {
      values[key] = entity.getValue(component, key);
    }
    return values;
  }

  watch(entity: Entity, callback: (snapshot: EntitySnapshot) => void): Unsubscribe {
    // Hook into component value changes
    const components = entity.getComponents();
    const unsubscribers: Unsubscribe[] = [];

    for (const comp of components) {
      // Proxy setValue to detect changes
      unsubscribers.push(this.interceptSetValue(entity, comp, () => {
        callback(this.getEntityState(entity));
      }));
    }

    return () => unsubscribers.forEach(u => u());
  }
}
```

**elics-Specific Features**:
- Leverages `entity.getComponents()` for component enumeration
- Uses `entity.getValue()` / `entity.setValue()` for data access
- Can display `entity.bitmask` for component composition debugging
- Supports Entity reference types with generation validation

---

### 3. System Profiler

**Purpose**: Monitor system performance and execution order.

**API Design**:

```typescript
interface SystemProfiler {
  // Profiling
  startProfiling(): void;
  stopProfiling(): void;

  // Metrics
  getSystemMetrics(system: AnySystem): SystemMetrics;
  getAllMetrics(): SystemMetrics[];
  getFrameMetrics(frameIndex: number): FrameMetrics;

  // Visualization data
  getExecutionOrder(): SystemExecutionInfo[];
  getSystemDependencies(): DependencyGraph;

  // Alerts
  setPerformanceThreshold(system: AnySystem, maxMs: number): void;
  onPerformanceAlert(callback: (alert: PerformanceAlert) => void): Unsubscribe;
}

interface SystemMetrics {
  system: AnySystem;
  name: string;
  priority: number;
  isPaused: boolean;

  // Timing (in milliseconds)
  lastUpdateTime: number;
  averageUpdateTime: number;
  minUpdateTime: number;
  maxUpdateTime: number;

  // Entity processing
  entitiesProcessed: number;       // Sum of query.entities.size
  queriesUsed: string[];           // Query identifiers

  // Call tracking
  updateCount: number;

  // Historical data
  history: TimingEntry[];          // Last N frames
}

interface FrameMetrics {
  frameIndex: number;
  totalTime: number;
  systemBreakdown: { system: AnySystem; time: number }[];
}

interface SystemExecutionInfo {
  system: AnySystem;
  name: string;
  priority: number;
  queries: QueryInfo[];
  configSchema: Record<string, unknown>;
}
```

**Implementation Strategy**:

```typescript
class SystemProfiler {
  private metrics = new Map<AnySystem, SystemMetrics>();

  wrapSystemUpdate(system: AnySystem): void {
    const originalUpdate = system.update.bind(system);

    system.update = (delta: number, time: number) => {
      const start = performance.now();
      originalUpdate(delta, time);
      const elapsed = performance.now() - start;

      this.recordTiming(system, elapsed);
    };
  }

  private recordTiming(system: AnySystem, elapsed: number): void {
    const metrics = this.metrics.get(system) ?? this.createMetrics(system);

    metrics.lastUpdateTime = elapsed;
    metrics.updateCount++;
    metrics.history.push({ frame: this.frameCount, time: elapsed });

    // Rolling window for history
    if (metrics.history.length > 1000) {
      metrics.history.shift();
    }

    // Update statistics
    metrics.averageUpdateTime = this.calculateAverage(metrics.history);
    metrics.minUpdateTime = Math.min(metrics.minUpdateTime, elapsed);
    metrics.maxUpdateTime = Math.max(metrics.maxUpdateTime, elapsed);

    // Check alerts
    if (elapsed > this.thresholds.get(system) ?? Infinity) {
      this.emit('performanceAlert', { system, elapsed, threshold: this.thresholds.get(system) });
    }
  }
}
```

**elics-Specific Integration**:
- Systems are stored in priority order in `world.systems`
- Access system info via `world.getSystems()` and `world.getSystem()`
- System config is stored as Preact signals in `system.config`
- Query references available via `system.queries`

---

### 4. Query Debugger

**Purpose**: Understand why entities match or don't match queries.

**API Design**:

```typescript
interface QueryDebugger {
  // Query listing
  getAllQueries(): QueryInfo[];
  getQueryInfo(query: Query): QueryInfo;

  // Match explanation
  explainMatch(entity: Entity, query: Query): MatchExplanation;
  whyNotMatching(entity: Entity, query: Query): MismatchReason[];

  // Event tracking
  trackQueryEvents(query: Query): QueryEventLog;

  // Visualization
  getQueryStats(query: Query): QueryStats;
}

interface QueryInfo {
  query: Query;
  queryId: string;
  requiredComponents: ComponentInfo[];
  excludedComponents: ComponentInfo[];
  valuePredicates: PredicateInfo[];
  entityCount: number;
  subscribers: { qualify: number; disqualify: number };
}

interface MatchExplanation {
  matches: boolean;
  requiredCheck: {
    passed: boolean;
    details: { component: AnyComponent; hasComponent: boolean }[];
  };
  excludedCheck: {
    passed: boolean;
    details: { component: AnyComponent; hasComponent: boolean }[];
  };
  predicateCheck: {
    passed: boolean;
    details: PredicateResult[];
  };
}

interface MismatchReason {
  type: 'missing_required' | 'has_excluded' | 'predicate_failed';
  component: AnyComponent;
  details: string;
  suggestion?: string;
}

interface PredicateResult {
  predicate: ValuePredicate;
  componentId: string;
  key: string;
  operator: string;
  expectedValue: unknown;
  actualValue: unknown;
  passed: boolean;
}

interface QueryEventLog {
  events: QueryEvent[];
  subscribe(callback: (event: QueryEvent) => void): Unsubscribe;
}

interface QueryEvent {
  type: 'qualify' | 'disqualify';
  entity: Entity;
  timestamp: number;
  frame: number;
  reason?: string;           // What component change triggered this
}
```

**Implementation Strategy**:

```typescript
class QueryDebugger {
  explainMatch(entity: Entity, query: Query): MatchExplanation {
    // Check required components
    const requiredDetails = query.requiredMask ?
      this.checkRequiredComponents(entity, query) : [];
    const requiredPassed = requiredDetails.every(d => d.hasComponent);

    // Check excluded components
    const excludedDetails = query.excludedMask ?
      this.checkExcludedComponents(entity, query) : [];
    const excludedPassed = excludedDetails.every(d => !d.hasComponent);

    // Check value predicates
    const predicateDetails = this.checkPredicates(entity, query);
    const predicatesPassed = predicateDetails.every(p => p.passed);

    return {
      matches: requiredPassed && excludedPassed && predicatesPassed,
      requiredCheck: { passed: requiredPassed, details: requiredDetails },
      excludedCheck: { passed: excludedPassed, details: excludedDetails },
      predicateCheck: { passed: predicatesPassed, details: predicateDetails }
    };
  }

  whyNotMatching(entity: Entity, query: Query): MismatchReason[] {
    const reasons: MismatchReason[] = [];
    const explanation = this.explainMatch(entity, query);

    // Find missing required components
    for (const detail of explanation.requiredCheck.details) {
      if (!detail.hasComponent) {
        reasons.push({
          type: 'missing_required',
          component: detail.component,
          details: `Entity is missing required component '${detail.component.id}'`,
          suggestion: `Add component: entity.addComponent(${detail.component.id})`
        });
      }
    }

    // Find problematic excluded components
    for (const detail of explanation.excludedCheck.details) {
      if (detail.hasComponent) {
        reasons.push({
          type: 'has_excluded',
          component: detail.component,
          details: `Entity has excluded component '${detail.component.id}'`,
          suggestion: `Remove component: entity.removeComponent(${detail.component.id})`
        });
      }
    }

    // Find failed predicates
    for (const pred of explanation.predicateCheck.details) {
      if (!pred.passed) {
        reasons.push({
          type: 'predicate_failed',
          component: pred.component,
          details: `Predicate failed: ${pred.key} ${pred.operator} ${pred.expectedValue} (actual: ${pred.actualValue})`,
          suggestion: `Set value: entity.setValue(${pred.componentId}, '${pred.key}', ${pred.expectedValue})`
        });
      }
    }

    return reasons;
  }

  trackQueryEvents(query: Query): QueryEventLog {
    const log: QueryEventLog = { events: [], subscribe: () => () => {} };
    const subscribers = new Set<(event: QueryEvent) => void>();

    // Hook into query subscriptions
    query.subscribe('qualify', (entity) => {
      const event: QueryEvent = {
        type: 'qualify',
        entity,
        timestamp: performance.now(),
        frame: this.debugger.frameCount
      };
      log.events.push(event);
      subscribers.forEach(cb => cb(event));
    });

    query.subscribe('disqualify', (entity) => {
      const event: QueryEvent = {
        type: 'disqualify',
        entity,
        timestamp: performance.now(),
        frame: this.debugger.frameCount
      };
      log.events.push(event);
      subscribers.forEach(cb => cb(event));
    });

    log.subscribe = (callback) => {
      subscribers.add(callback);
      return () => subscribers.delete(callback);
    };

    return log;
  }
}
```

**elics-Specific Features**:
- Uses Query's `requiredMask` and `excludedMask` for bitmask analysis
- Leverages `valuePredicates` for predicate evaluation
- Hooks into existing `query.subscribe('qualify' | 'disqualify')` events
- Works with query helpers: `eq`, `ne`, `lt`, `le`, `gt`, `ge`, `isin`, `nin`

---

### 5. State Snapshots

**Purpose**: Capture and restore world state for time-travel debugging.

**API Design**:

```typescript
interface StateSnapshotManager {
  // Capture
  capture(label?: string): Snapshot;
  captureEntity(entity: Entity): EntitySnapshot;

  // Restore
  restore(snapshot: Snapshot): void;
  restoreEntity(entity: Entity, snapshot: EntitySnapshot): void;

  // Auto-capture
  enableAutoCapture(options: AutoCaptureOptions): void;
  disableAutoCapture(): void;

  // History navigation
  getSnapshots(): SnapshotInfo[];
  getSnapshot(id: string): Snapshot | undefined;
  deleteSnapshot(id: string): void;

  // Diff
  diff(before: Snapshot, after: Snapshot): WorldDiff;
  diffEntity(before: EntitySnapshot, after: EntitySnapshot): EntityDiff;
}

interface Snapshot {
  id: string;
  label?: string;
  timestamp: number;
  frame: number;

  // World state
  entities: SerializedEntity[];
  globals: Record<string, unknown>;
  systemStates: SerializedSystemState[];

  // Metadata
  entityCount: number;
  componentCounts: Record<string, number>;
  memoryEstimate: number;
}

interface SerializedEntity {
  index: number;
  generation: number;
  active: boolean;
  components: SerializedComponent[];
}

interface SerializedComponent {
  componentId: string;
  values: Record<string, unknown>;
}

interface AutoCaptureOptions {
  interval?: number;           // Capture every N frames
  maxSnapshots?: number;       // Rolling buffer size
  captureOn?: SnapshotTrigger[];
}

type SnapshotTrigger =
  | { type: 'entityCreated' }
  | { type: 'entityDestroyed' }
  | { type: 'componentAdded'; component?: AnyComponent }
  | { type: 'componentRemoved'; component?: AnyComponent }
  | { type: 'breakpointHit' };

interface WorldDiff {
  entitiesCreated: EntitySnapshot[];
  entitiesDestroyed: EntitySnapshot[];
  entitiesModified: EntityDiff[];
  globalsChanged: { key: string; before: unknown; after: unknown }[];
}

interface EntityDiff {
  entity: Entity;
  componentsAdded: ComponentSnapshot[];
  componentsRemoved: ComponentSnapshot[];
  valuesChanged: ValueChange[];
}

interface ValueChange {
  componentId: string;
  key: string;
  before: unknown;
  after: unknown;
}
```

**Implementation Strategy**:

```typescript
class StateSnapshotManager {
  capture(label?: string): Snapshot {
    const entities: SerializedEntity[] = [];

    // Iterate all active entities
    for (const entity of this.getAllActiveEntities()) {
      const components: SerializedComponent[] = [];

      for (const comp of entity.getComponents()) {
        components.push({
          componentId: comp.id,
          values: this.serializeComponentValues(entity, comp)
        });
      }

      entities.push({
        index: entity.index,
        generation: entity.generation,
        active: entity.active,
        components
      });
    }

    return {
      id: crypto.randomUUID(),
      label,
      timestamp: performance.now(),
      frame: this.debugger.frameCount,
      entities,
      globals: structuredClone(this.world.globals),
      systemStates: this.captureSystemStates(),
      entityCount: entities.length,
      componentCounts: this.countComponents(entities),
      memoryEstimate: this.estimateMemory(entities)
    };
  }

  restore(snapshot: Snapshot): void {
    // Clear current state
    this.clearWorld();

    // Restore globals
    Object.assign(this.world.globals, snapshot.globals);

    // Restore entities
    for (const serialized of snapshot.entities) {
      const entity = this.world.createEntity();

      for (const comp of serialized.components) {
        const component = ComponentRegistry.getById(comp.componentId);
        if (component) {
          entity.addComponent(component, comp.values);
        }
      }
    }

    // Restore system states
    this.restoreSystemStates(snapshot.systemStates);
  }

  diff(before: Snapshot, after: Snapshot): WorldDiff {
    const beforeMap = new Map(before.entities.map(e => [e.index, e]));
    const afterMap = new Map(after.entities.map(e => [e.index, e]));

    const created: EntitySnapshot[] = [];
    const destroyed: EntitySnapshot[] = [];
    const modified: EntityDiff[] = [];

    // Find created entities
    for (const [index, entity] of afterMap) {
      if (!beforeMap.has(index)) {
        created.push(this.toEntitySnapshot(entity));
      }
    }

    // Find destroyed entities
    for (const [index, entity] of beforeMap) {
      if (!afterMap.has(index)) {
        destroyed.push(this.toEntitySnapshot(entity));
      }
    }

    // Find modified entities
    for (const [index, beforeEntity] of beforeMap) {
      const afterEntity = afterMap.get(index);
      if (afterEntity) {
        const diff = this.diffEntities(beforeEntity, afterEntity);
        if (diff) {
          modified.push(diff);
        }
      }
    }

    return { entitiesCreated: created, entitiesDestroyed: destroyed, entitiesModified: modified, globalsChanged: this.diffGlobals(before.globals, after.globals) };
  }
}
```

**elics-Specific Considerations**:
- Uses `ComponentRegistry.getById()` to resolve components by ID during restore
- Entity generation must be handled (restored entities get new generations)
- Entity references in component values need special handling (re-packing)
- TypedArray data can be efficiently serialized/deserialized
- System config signals need to be captured and restored

---

### 6. Event Timeline

**Purpose**: Record and visualize entity lifecycle and component changes over time.

**API Design**:

```typescript
interface EventTimeline {
  // Recording
  startRecording(): void;
  stopRecording(): void;
  isRecording(): boolean;

  // Playback
  getEvents(filter?: EventFilter): TimelineEvent[];
  getEventsByEntity(entity: Entity): TimelineEvent[];
  getEventsByComponent(component: AnyComponent): TimelineEvent[];
  getEventsByFrame(frame: number): TimelineEvent[];
  getEventsInRange(startFrame: number, endFrame: number): TimelineEvent[];

  // Statistics
  getStats(): TimelineStats;

  // Export
  exportToJSON(): string;
  importFromJSON(json: string): void;
}

type TimelineEvent =
  | EntityCreatedEvent
  | EntityDestroyedEvent
  | ComponentAddedEvent
  | ComponentRemovedEvent
  | ComponentValueChangedEvent
  | QueryQualifyEvent
  | QueryDisqualifyEvent
  | SystemUpdateEvent;

interface BaseEvent {
  id: string;
  frame: number;
  timestamp: number;
}

interface EntityCreatedEvent extends BaseEvent {
  type: 'entityCreated';
  entityIndex: number;
  entityGeneration: number;
}

interface EntityDestroyedEvent extends BaseEvent {
  type: 'entityDestroyed';
  entityIndex: number;
  entityGeneration: number;
  componentsAtDestruction: string[];  // Component IDs
}

interface ComponentAddedEvent extends BaseEvent {
  type: 'componentAdded';
  entityIndex: number;
  componentId: string;
  initialValues: Record<string, unknown>;
}

interface ComponentRemovedEvent extends BaseEvent {
  type: 'componentRemoved';
  entityIndex: number;
  componentId: string;
  finalValues: Record<string, unknown>;
}

interface ComponentValueChangedEvent extends BaseEvent {
  type: 'valueChanged';
  entityIndex: number;
  componentId: string;
  key: string;
  oldValue: unknown;
  newValue: unknown;
  source?: string;  // System name if known
}

interface QueryQualifyEvent extends BaseEvent {
  type: 'queryQualify';
  queryId: string;
  entityIndex: number;
  triggerComponent?: string;
}

interface QueryDisqualifyEvent extends BaseEvent {
  type: 'queryDisqualify';
  queryId: string;
  entityIndex: number;
  triggerComponent?: string;
}

interface EventFilter {
  types?: TimelineEvent['type'][];
  entityIndex?: number;
  componentId?: string;
  frameRange?: { start: number; end: number };
  limit?: number;
}

interface TimelineStats {
  totalEvents: number;
  eventsByType: Record<TimelineEvent['type'], number>;
  framesRecorded: number;
  entitiesCreated: number;
  entitiesDestroyed: number;
  componentsAddedTotal: number;
  componentsRemovedTotal: number;
  valueChangesTotal: number;
}
```

**Implementation Strategy**:

```typescript
class EventTimeline {
  private events: TimelineEvent[] = [];
  private recording = false;

  startRecording(): void {
    this.recording = true;

    // Hook into entity creation
    this.hookEntityCreation();

    // Hook into entity destruction
    this.hookEntityDestruction();

    // Hook into component operations
    this.hookComponentOperations();

    // Hook into value changes
    this.hookValueChanges();

    // Hook into query events
    this.hookQueryEvents();
  }

  private hookEntityCreation(): void {
    const originalCreate = this.world.createEntity.bind(this.world);

    this.world.createEntity = () => {
      const entity = originalCreate();

      if (this.recording) {
        this.events.push({
          id: crypto.randomUUID(),
          type: 'entityCreated',
          frame: this.debugger.frameCount,
          timestamp: performance.now(),
          entityIndex: entity.index,
          entityGeneration: entity.generation
        });
      }

      return entity;
    };
  }

  private hookValueChanges(): void {
    // Proxy entity.setValue to track changes
    const originalSetValue = Entity.prototype.setValue;

    Entity.prototype.setValue = function<C, K>(
      this: Entity,
      component: C,
      key: K,
      value: unknown
    ) {
      const oldValue = this.getValue(component, key);
      originalSetValue.call(this, component, key, value);

      if (timeline.recording && oldValue !== value) {
        timeline.events.push({
          id: crypto.randomUUID(),
          type: 'valueChanged',
          frame: timeline.debugger.frameCount,
          timestamp: performance.now(),
          entityIndex: this.index,
          componentId: (component as AnyComponent).id,
          key: key as string,
          oldValue,
          newValue: value
        });
      }
    };
  }
}
```

**elics-Specific Integration Points**:
- Entity creation via `world.createEntity()`
- Entity destruction via `entity.destroy()` and `entityReleaseCallback`
- Component operations via `entity.addComponent()` / `entity.removeComponent()`
- Value changes via `entity.setValue()`
- Query events via `query.subscribe('qualify' | 'disqualify')`

---

## Main Debugger API

The unified debugger interface that combines all modules:

```typescript
interface ECSDebugger {
  // Core modules
  readonly execution: ExecutionController;
  readonly entities: EntityInspector;
  readonly systems: SystemProfiler;
  readonly queries: QueryDebugger;
  readonly snapshots: StateSnapshotManager;
  readonly timeline: EventTimeline;

  // Lifecycle
  attach(world: World): void;
  detach(): void;

  // Global controls
  enable(): void;
  disable(): void;
  isEnabled(): boolean;

  // Events
  on(event: DebuggerEvent, callback: DebuggerEventCallback): Unsubscribe;

  // Configuration
  configure(options: DebuggerOptions): void;
}

interface DebuggerOptions {
  // Performance
  enableProfiling?: boolean;
  enableTimeline?: boolean;

  // Limits
  maxSnapshots?: number;
  maxTimelineEvents?: number;
  profilingHistorySize?: number;

  // Behavior
  pauseOnBreakpoint?: boolean;
  autoSnapshotOnBreakpoint?: boolean;
}

type DebuggerEvent =
  | 'pause'
  | 'resume'
  | 'step'
  | 'breakpointHit'
  | 'performanceAlert'
  | 'snapshotCreated'
  | 'snapshotRestored';

// Factory function
function createDebugger(world: World, options?: DebuggerOptions): ECSDebugger;
```

---

## Usage Example

```typescript
import { World, createComponent, createSystem, Types } from 'elics';
import { createDebugger } from 'elics/debug';

// Define components
const Position = createComponent('Position', {
  x: { type: Types.Float32 },
  y: { type: Types.Float32 }
});

const Velocity = createComponent('Velocity', {
  x: { type: Types.Float32 },
  y: { type: Types.Float32 }
});

// Create world and debugger
const world = new World();
const debugger = createDebugger(world, {
  enableProfiling: true,
  enableTimeline: true
});

// Register components and systems
world.registerComponent(Position);
world.registerComponent(Velocity);

// Set up breakpoint
debugger.execution.setBreakpoint({
  type: 'componentValueChanged',
  component: Position,
  key: 'x'
});

// Start timeline recording
debugger.timeline.startRecording();

// Create entities
const entity = world.createEntity();
entity.addComponent(Position, { x: 0, y: 0 });
entity.addComponent(Velocity, { x: 1, y: 0 });

// Game loop
function gameLoop(time: number) {
  if (!debugger.execution.isPaused) {
    world.update(16.67, time);
  }

  requestAnimationFrame(gameLoop);
}

// Inspect entity state
console.log(debugger.entities.getEntityState(entity));
// { index: 0, generation: 0, components: [...], ... }

// Check system performance
console.log(debugger.systems.getAllMetrics());
// [{ name: 'MovementSystem', averageUpdateTime: 0.5, ... }]

// Understand query matching
const movingEntities = world.registerQuery({
  required: [Position, Velocity]
});
console.log(debugger.queries.explainMatch(entity, movingEntities));
// { matches: true, requiredCheck: { passed: true, ... }, ... }

// Capture snapshot
const snapshot = debugger.snapshots.capture('before-collision');

// ... later, restore state
debugger.snapshots.restore(snapshot);

// Step execution
debugger.execution.pause();
debugger.execution.step(1);  // Execute one frame
debugger.execution.stepSystem(movementSystem);  // Execute single system

// View timeline
console.log(debugger.timeline.getEventsByEntity(entity));
// [{ type: 'entityCreated', ... }, { type: 'componentAdded', ... }, ...]
```

---

## Implementation Phases

### Phase 1: Core Infrastructure (Essential)
1. **ExecutionController** - Pause/resume/step functionality
2. **EntityInspector** - Basic entity and component inspection
3. **Debugger shell** - Factory function and attach/detach

### Phase 2: Profiling & Analysis
4. **SystemProfiler** - Performance measurement and metrics
5. **QueryDebugger** - Query explanation and event tracking

### Phase 3: Advanced Features
6. **StateSnapshotManager** - Capture and restore
7. **EventTimeline** - Full event recording and playback

### Phase 4: UI & Visualization (Optional)
8. Web-based inspector UI (like Flecs Explorer)
9. Real-time visualization graphs
10. Export/import capabilities

---

## Technical Considerations

### Performance Impact

The debugger should have minimal impact when disabled:

```typescript
class ECSDebugger {
  private enabled = false;

  // Hot path - check enabled first
  recordEvent(event: TimelineEvent): void {
    if (!this.enabled) return;
    // ... recording logic
  }
}
```

Recommendations:
- Use feature flags for each module
- Lazy initialization of heavy features
- Consider separate debug vs production builds
- Sampling for high-frequency events (value changes)

### Memory Management

- Implement circular buffers for timeline events
- Limit snapshot history with configurable max
- Provide explicit cleanup APIs
- Use WeakRefs where appropriate to prevent memory leaks

### Thread Safety (Future)

If elics ever supports Web Workers:
- Ensure debugger state is serializable
- Consider message-passing for cross-worker debugging
- Snapshot transfer between contexts

---

## Research Sources

This proposal was informed by:

- [Unity ECS Debugging](https://docs.unity3d.com/Packages/com.unity.entities@0.1/manual/ecs_debugging.html) - Entity Debugger window, system on/off toggles
- [Flecs Explorer](https://github.com/flecs-hub/explorer) - Web-based monitoring, query inspection, statistics
- [JetBrains Rider Pausepoints](https://www.jetbrains.com/help/rider/Debugging_Unity_Applications.html) - Pause Unity at end of frame
- [Godot Debugger](https://www.gdquest.com/tutorial/godot/gdscript/debugging/) - Step execution, breakpoints
- [SanderMertens/ecs-faq](https://github.com/SanderMertens/ecs-faq) - ECS best practices and patterns

---

## Summary

This debugger proposal provides comprehensive tooling for elics ECS development:

| Feature | Purpose | elics Integration Point |
|---------|---------|------------------------|
| Execution Control | Pause/resume/step | `world.update()` wrapper |
| Entity Inspector | View/modify entities | `entity.getComponents()`, `getValue/setValue` |
| System Profiler | Performance monitoring | `world.getSystems()`, system update wrapping |
| Query Debugger | Match explanation | `Query.requiredMask`, `subscribe()` |
| State Snapshots | Time-travel debugging | `ComponentRegistry`, entity serialization |
| Event Timeline | Change history | Method proxying, query subscriptions |

The modular design allows incremental implementation and optional features based on development needs.

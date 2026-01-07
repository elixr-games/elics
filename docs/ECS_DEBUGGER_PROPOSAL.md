# elics ECS Debugger Proposal

## Executive Summary

This proposal outlines a debugging tool for the elics ECS framework, designed to work seamlessly with both standalone elics applications and frameworks built on top of it (like immersive-web-sdk).

**Core capabilities:**
1. **Execution Control** - Pause, resume, step-by-step execution
2. **Entity Inspector** - Real-time component value inspection and editing
3. **System Profiler** - Performance monitoring and execution order visualization
4. **Query Debugger** - Query matching analysis and subscription event tracking
5. **State Snapshots** - Capture and restore world state for time-travel debugging
6. **Event Timeline** - Track entity lifecycle and component changes over time

**Key design decisions:**
- Uses **attach pattern** (runtime method patching) instead of wrapping
- Distributed as **subpath export** (`elics/debug`) for tree-shaking
- Works with **World subclasses** (tested against immersive-web-sdk)
- Render loop stays **under application control**

---

## Architecture Overview

### Attach Pattern

The debugger attaches to an existing World instance via runtime method patching. This approach:

- Works with World subclasses (IWSDK's World extends elics World)
- Doesn't require changing application code structure
- Can be completely detached to restore original behavior
- Has zero overhead when detached

```
┌─────────────────────────────────────────────────────────────────┐
│                     Application Code                             │
│                                                                  │
│  const world = new World();        // or IWSDK World.create()   │
│  const debug = attachDebugger(world);                           │
│                                                                  │
│  // Game loop continues as normal                               │
│  function loop() {                                              │
│    world.update(delta, time);  // Debugger intercepts this      │
│    render();                                                    │
│  }                                                              │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                        Debugger                                  │
│                                                                  │
│  Patches:                     Reads (no patching):              │
│  - world.update()             - world.getSystems()              │
│  - system.update() (profiler) - entity.getComponents()          │
│  - entity.setValue() (watch)  - entity.getValue()               │
│                               - query.subscribe()               │
└─────────────────────────────────────────────────────────────────┘
```

### Packaging: Subpath Export

```
elics/
├── src/
│   ├── index.ts           # Core ECS (World, Entity, Component, System)
│   └── debug/
│       ├── index.ts       # Main debugger entry
│       ├── execution.ts   # Pause/resume/step
│       ├── inspector.ts   # Entity inspection
│       ├── profiler.ts    # System timing
│       ├── queries.ts     # Query debugging
│       ├── snapshots.ts   # State capture/restore
│       └── timeline.ts    # Event recording
```

**package.json:**
```json
{
  "exports": {
    ".": "./dist/index.js",
    "./debug": "./dist/debug/index.js"
  }
}
```

**Usage:**
```typescript
import { World } from 'elics';
import { attachDebugger } from 'elics/debug';
```

---

## Usage Examples

### Basic Usage

```typescript
import { World, createComponent, createSystem, Types } from 'elics';
import { attachDebugger } from 'elics/debug';

// Create world as normal
const world = new World();

// Attach debugger
const debug = attachDebugger(world);

// Register components and systems as normal
const Position = createComponent('Position', {
  x: { type: Types.Float32 },
  y: { type: Types.Float32 }
});

world.registerComponent(Position);

// Game loop - unchanged!
function gameLoop(time: number) {
  const delta = 16.67;
  world.update(delta, time);  // Debugger intercepts this automatically
  requestAnimationFrame(gameLoop);
}

// Debugger controls (from devtools, UI, or console)
debug.pause();           // Pauses ECS updates
debug.step();            // Execute one frame
debug.step(10);          // Execute 10 frames
debug.resume();          // Resume normal execution

// Inspect entities
const entity = world.createEntity();
entity.addComponent(Position, { x: 100, y: 200 });
console.log(debug.inspect.entity(entity));
// { index: 0, generation: 0, components: [{ id: 'Position', values: { x: 100, y: 200 } }] }

// When done debugging
debug.detach();  // Restores original world.update()
```

### With immersive-web-sdk

```typescript
import { World } from '@aspect-build/core';
import { attachDebugger } from 'elics/debug';

// IWSDK's World extends elics World
const world = await World.create(container, {
  features: { enableLocomotion: true }
});

// Attach debugger - works with subclass!
const debug = attachDebugger(world);

// IWSDK's render loop continues via setAnimationLoop
// Debugger intercepts world.update() inside that loop

// Inspect IWSDK-specific properties
const entity = world.createTransformEntity();
const snapshot = debug.inspect.entity(entity);
console.log(snapshot);
// {
//   index: 5,
//   generation: 0,
//   components: [{ id: 'Transform', values: { position: [0,0,0], ... } }],
//   object3D: { position: Vector3, ... }  // If present
// }

// Debug XR visibility state changes
debug.on('frameComplete', ({ frame }) => {
  console.log(`Frame ${frame}, visibility: ${world.visibilityState.value}`);
});
```

### Debugging Queries

```typescript
const MovingEntities = world.registerQuery({
  required: [Position, Velocity],
  where: [gt(Velocity, 'speed', 0)]
});

// Why isn't my entity matching?
const entity = world.createEntity();
entity.addComponent(Position, { x: 0, y: 0 });
entity.addComponent(Velocity, { speed: 0 });  // speed is 0!

const result = debug.queries.explainMatch(entity, MovingEntities);
console.log(result);
// {
//   matches: false,
//   requiredCheck: { passed: true, ... },
//   predicateCheck: {
//     passed: false,
//     details: [{
//       key: 'speed',
//       operator: 'gt',
//       expected: 0,
//       actual: 0,
//       passed: false  // gt(0, 0) is false!
//     }]
//   }
// }

// Track query events
debug.queries.track(MovingEntities, (event) => {
  console.log(`Entity ${event.entity.index} ${event.type}`);
  // "Entity 3 qualify" / "Entity 3 disqualify"
});
```

### Profiling Systems

```typescript
// Enable profiling
debug.profiler.enable();

// Run for a while...

// Get metrics
const metrics = debug.profiler.getMetrics();
for (const m of metrics) {
  console.log(`${m.name}: avg ${m.avgTime.toFixed(2)}ms, max ${m.maxTime.toFixed(2)}ms`);
}
// "LocomotionSystem: avg 0.12ms, max 0.45ms"
// "InputSystem: avg 0.08ms, max 0.22ms"
// "PhysicsSystem: avg 1.24ms, max 3.10ms"  // <- bottleneck!

// Set alert threshold
debug.profiler.setThreshold('PhysicsSystem', 2.0);
debug.on('performanceAlert', ({ system, time, threshold }) => {
  console.warn(`${system} took ${time}ms (threshold: ${threshold}ms)`);
});
```

### Time-Travel Debugging

```typescript
// Capture state before something happens
const beforeCollision = debug.snapshots.capture('before-collision');

// ... game runs, bug occurs ...

// Capture current state
const afterBug = debug.snapshots.capture('after-bug');

// See what changed
const diff = debug.snapshots.diff(beforeCollision, afterBug);
console.log('Entities destroyed:', diff.entitiesDestroyed.length);
console.log('Values changed:', diff.valuesChanged);

// Restore to before the bug
debug.snapshots.restore(beforeCollision);
// World is now back to pre-collision state!
```

---

## API Reference

### Main Entry Point

```typescript
import { attachDebugger, type Debugger, type DebuggerOptions } from 'elics/debug';

function attachDebugger(world: World, options?: DebuggerOptions): Debugger;

interface DebuggerOptions {
  // Performance
  enableProfiling?: boolean;    // Default: false
  enableTimeline?: boolean;     // Default: false

  // Limits
  maxSnapshots?: number;        // Default: 50
  maxTimelineEvents?: number;   // Default: 10000
  profilingHistorySize?: number; // Default: 1000 frames
}

interface Debugger {
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
  on(event: DebugEvent, callback: DebugCallback): () => void;

  // Lifecycle
  detach(): void;
}

type DebugEvent =
  | 'pause'
  | 'resume'
  | 'step'
  | 'frameComplete'
  | 'breakpointHit'
  | 'performanceAlert';
```

### Entity Inspector

```typescript
interface EntityInspector {
  // Get entity state
  entity(entity: Entity): EntitySnapshot;
  entities(): EntitySnapshot[];
  entitiesByComponent(component: AnyComponent): Entity[];

  // Live watching
  watch(entity: Entity, callback: (snapshot: EntitySnapshot) => void): () => void;

  // Debug modification
  setValue<C extends AnyComponent, K extends keyof C['schema']>(
    entity: Entity,
    component: C,
    key: K,
    value: any
  ): void;
}

interface EntitySnapshot {
  index: number;
  generation: number;
  active: boolean;
  components: ComponentSnapshot[];

  // Extended info (if available from IWSDK)
  object3D?: {
    position: { x: number; y: number; z: number };
    rotation: { x: number; y: number; z: number; w: number };
    scale: { x: number; y: number; z: number };
    visible: boolean;
    name?: string;
  };
}

interface ComponentSnapshot {
  id: string;
  description?: string;
  values: Record<string, unknown>;
}
```

### System Profiler

```typescript
interface SystemProfiler {
  enable(): void;
  disable(): void;
  isEnabled(): boolean;

  getMetrics(): SystemMetrics[];
  getMetricsFor(system: AnySystem): SystemMetrics;

  setThreshold(systemName: string, maxMs: number): void;
  clearThreshold(systemName: string): void;
}

interface SystemMetrics {
  name: string;
  priority: number;
  isPaused: boolean;

  // Timing (milliseconds)
  lastTime: number;
  avgTime: number;
  minTime: number;
  maxTime: number;

  // Call stats
  updateCount: number;

  // Queries used
  queryNames: string[];
  totalEntitiesProcessed: number;
}
```

### Query Debugger

```typescript
interface QueryDebugger {
  // List all queries
  list(): QueryInfo[];

  // Explain matching
  explainMatch(entity: Entity, query: Query): MatchExplanation;
  whyNotMatching(entity: Entity, query: Query): MismatchReason[];

  // Track events
  track(query: Query, callback: (event: QueryEvent) => void): () => void;
}

interface QueryInfo {
  id: string;
  required: string[];      // Component IDs
  excluded: string[];
  predicates: PredicateInfo[];
  entityCount: number;
}

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

interface MismatchReason {
  type: 'missing_required' | 'has_excluded' | 'predicate_failed';
  componentId: string;
  message: string;
  suggestion: string;
}

interface QueryEvent {
  type: 'qualify' | 'disqualify';
  entity: Entity;
  frame: number;
  timestamp: number;
}
```

### Snapshot Manager

```typescript
interface SnapshotManager {
  capture(label?: string): Snapshot;
  restore(snapshot: Snapshot): void;

  list(): SnapshotInfo[];
  get(id: string): Snapshot | undefined;
  delete(id: string): void;
  clear(): void;

  diff(before: Snapshot, after: Snapshot): WorldDiff;

  // Auto-capture
  enableAutoCapture(options: {
    interval?: number;       // Every N frames
    maxSnapshots?: number;   // Rolling buffer
  }): void;
  disableAutoCapture(): void;
}

interface Snapshot {
  id: string;
  label?: string;
  frame: number;
  timestamp: number;
  entityCount: number;

  // Internal serialized state
  _data: SerializedWorldState;
}

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

### Event Timeline

```typescript
interface EventTimeline {
  startRecording(): void;
  stopRecording(): void;
  isRecording(): boolean;

  getEvents(filter?: EventFilter): TimelineEvent[];
  getStats(): TimelineStats;

  clear(): void;
  export(): string;  // JSON
}

interface EventFilter {
  types?: TimelineEventType[];
  entityIndex?: number;
  componentId?: string;
  frameRange?: { start: number; end: number };
  limit?: number;
}

type TimelineEventType =
  | 'entityCreated'
  | 'entityDestroyed'
  | 'componentAdded'
  | 'componentRemoved'
  | 'valueChanged'
  | 'queryQualify'
  | 'queryDisqualify';

interface TimelineEvent {
  type: TimelineEventType;
  frame: number;
  timestamp: number;
  entityIndex: number;
  componentId?: string;
  details?: Record<string, unknown>;
}
```

---

## Implementation Details

### Method Patching Strategy

```typescript
export function attachDebugger(world: World, options?: DebuggerOptions): Debugger {
  // Store original methods
  const originals = {
    update: world.update.bind(world),
    // System.update is patched per-system when profiling enabled
  };

  // Debugger state
  let paused = false;
  let pendingSteps = 0;
  let frameCount = 0;

  // Patch world.update
  world.update = function(delta: number, time: number) {
    // Skip if paused (unless stepping)
    if (paused && pendingSteps <= 0) {
      return;
    }

    if (pendingSteps > 0) {
      pendingSteps--;
    }

    // Call original
    originals.update(delta, time);
    frameCount++;

    // Emit frame complete event
    emit('frameComplete', { frame: frameCount, delta, time });
  };

  return {
    get isPaused() { return paused; },
    get frameCount() { return frameCount; },

    pause() {
      paused = true;
      emit('pause', { frame: frameCount });
    },

    resume() {
      paused = false;
      emit('resume', { frame: frameCount });
    },

    step(frames = 1) {
      pendingSteps = frames;
      emit('step', { frames, frame: frameCount });
    },

    detach() {
      // Restore original methods
      world.update = originals.update;
      // Restore system.update for each patched system
    },

    // ... sub-modules
  };
}
```

### IWSDK Compatibility

The debugger automatically detects and handles IWSDK-specific features:

```typescript
// In EntityInspector
entity(entity: Entity): EntitySnapshot {
  const snapshot: EntitySnapshot = {
    index: entity.index,
    generation: entity.generation,
    active: entity.active,
    components: this.getComponentSnapshots(entity),
  };

  // Detect IWSDK's object3D binding
  if ('object3D' in entity && entity.object3D) {
    const obj = entity.object3D;
    snapshot.object3D = {
      position: { x: obj.position.x, y: obj.position.y, z: obj.position.z },
      rotation: {
        x: obj.quaternion.x,
        y: obj.quaternion.y,
        z: obj.quaternion.z,
        w: obj.quaternion.w
      },
      scale: { x: obj.scale.x, y: obj.scale.y, z: obj.scale.z },
      visible: obj.visible,
      name: obj.name || undefined,
    };
  }

  return snapshot;
}
```

### System Profiler Patching

```typescript
// In SystemProfiler
enable() {
  const systems = this.world.getSystems();

  for (const system of systems) {
    const original = system.update.bind(system);
    const metrics = this.getOrCreateMetrics(system);

    system.update = (delta: number, time: number) => {
      const start = performance.now();
      original(delta, time);
      const elapsed = performance.now() - start;

      this.recordTiming(metrics, elapsed);
    };

    this.patchedSystems.set(system, original);
  }
}

disable() {
  // Restore all original update methods
  for (const [system, original] of this.patchedSystems) {
    system.update = original;
  }
  this.patchedSystems.clear();
}
```

---

## Implementation Phases

### Phase 1: Core (MVP)
- `attachDebugger()` / `detach()`
- Pause / resume / step
- Basic entity inspection (`inspect.entity()`, `inspect.entities()`)
- Basic system listing

**Estimated scope:** ~500 lines

### Phase 2: Profiling & Queries
- System profiler with timing
- Query debugger with `explainMatch()` and `whyNotMatching()`
- Query event tracking

**Estimated scope:** ~800 lines

### Phase 3: Time Travel
- Snapshot capture / restore
- Snapshot diff
- Auto-capture mode

**Estimated scope:** ~600 lines

### Phase 4: Timeline & Polish
- Event timeline recording
- Event filtering and export
- Performance optimizations
- Documentation

**Estimated scope:** ~700 lines

---

## Compatibility Matrix

| Feature | elics standalone | IWSDK |
|---------|-----------------|-------|
| Pause/Resume/Step | ✅ | ✅ |
| Entity inspection | ✅ | ✅ + Object3D |
| System profiling | ✅ | ✅ |
| Query debugging | ✅ | ✅ |
| Snapshots | ✅ | ✅ (excludes GPU resources) |
| Timeline | ✅ | ✅ |
| XR state tracking | N/A | ✅ via world.visibilityState |
| Level tracking | N/A | ✅ via world.activeLevel |

---

## Research Sources

- [Unity ECS Debugging](https://docs.unity3d.com/Packages/com.unity.entities@0.1/manual/ecs_debugging.html)
- [Flecs Explorer](https://github.com/flecs-hub/explorer)
- [JetBrains Rider Pausepoints](https://www.jetbrains.com/help/rider/Debugging_Unity_Applications.html)
- [SanderMertens/ecs-faq](https://github.com/SanderMertens/ecs-faq)
- immersive-web-sdk source code analysis

---

## Summary

The elics debugger uses the **attach pattern** to provide comprehensive debugging capabilities without requiring changes to application code. It's distributed as a **subpath export** for optimal tree-shaking and works seamlessly with both standalone elics and frameworks like immersive-web-sdk.

Key features:
- **Pause/Resume/Step** - Control ECS execution
- **Entity Inspector** - View component values, including IWSDK's Object3D
- **System Profiler** - Identify performance bottlenecks
- **Query Debugger** - Understand why entities match or don't match
- **Snapshots** - Time-travel debugging
- **Timeline** - Record and analyze entity lifecycle events

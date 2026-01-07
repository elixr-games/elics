import { World } from '../src/world';
import { createComponent } from '../src/component';
import { createSystem } from '../src/system';
import { Types } from '../src/types';
import { eq, ne, lt, le, gt, ge, isin, nin } from '../src/query-helpers';
import { attachDebugger } from '../src/debug';

// Test components
const Position = createComponent('Position', {
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const Velocity = createComponent('Velocity', {
	vx: { type: Types.Float32, default: 0 },
	vy: { type: Types.Float32, default: 0 },
});

const Health = createComponent('Health', {
	value: { type: Types.Int16, default: 100 },
});

// Test system
class MovementSystem extends createSystem({
	moving: { required: [Position, Velocity] },
}) {
	update(delta: number): void {
		for (const entity of this.queries.moving.entities) {
			const x = entity.getValue(Position, 'x')!;
			const vx = entity.getValue(Velocity, 'vx')!;
			entity.setValue(Position, 'x', x + vx * delta);
		}
	}
}

describe('ECS Debugger', () => {
	let world: World;

	beforeEach(() => {
		world = new World({ checksOn: false });
		world.registerComponent(Position);
		world.registerComponent(Velocity);
		world.registerComponent(Health);
	});

	describe('attachDebugger / detach', () => {
		test('attaches and detaches cleanly', () => {
			const debug = attachDebugger(world);

			expect(debug).toBeDefined();
			expect(debug.isPaused).toBe(false);
			expect(debug.frameCount).toBe(0);

			// Detach should not throw
			expect(() => debug.detach()).not.toThrow();
		});

		test('detach restores original behavior', () => {
			world.registerSystem(MovementSystem);
			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });
			entity.addComponent(Velocity, { vx: 10, vy: 0 });

			const debug = attachDebugger(world);

			// Pause should work while attached
			debug.pause();
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(0); // Paused, no update

			debug.detach();

			// After detach, pause no longer affects updates
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(10); // Normal update
		});
	});

	describe('Execution Control', () => {
		test('pause prevents updates', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });
			entity.addComponent(Velocity, { vx: 10, vy: 0 });

			// Run one frame
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(10);
			expect(debug.frameCount).toBe(1);

			// Pause
			debug.pause();
			expect(debug.isPaused).toBe(true);

			// Updates should be skipped
			world.update(1, 0);
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(10);
			expect(debug.frameCount).toBe(1);

			debug.detach();
		});

		test('resume continues updates', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });
			entity.addComponent(Velocity, { vx: 10, vy: 0 });

			debug.pause();
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(0);

			debug.resume();
			world.update(1, 0);
			expect(entity.getValue(Position, 'x')).toBe(10);

			debug.detach();
		});

		test('step executes specified number of frames', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });
			entity.addComponent(Velocity, { vx: 10, vy: 0 });

			debug.pause();

			// Step 3 frames
			debug.step(3);
			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0); // This should be skipped

			expect(entity.getValue(Position, 'x')).toBe(30);
			expect(debug.frameCount).toBe(3);

			debug.detach();
		});

		test('emits pause/resume/step events', () => {
			const debug = attachDebugger(world);
			const events: string[] = [];

			debug.on('pause', () => events.push('pause'));
			debug.on('resume', () => events.push('resume'));
			debug.on('step', () => events.push('step'));

			debug.pause();
			debug.resume();
			debug.step();

			expect(events).toEqual(['pause', 'resume', 'step']);

			debug.detach();
		});

		test('emits frameComplete event', () => {
			const debug = attachDebugger(world);
			const frames: number[] = [];

			debug.on('frameComplete', ({ frame }) => frames.push(frame));

			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0);

			expect(frames).toEqual([1, 2, 3]);

			debug.detach();
		});
	});

	describe('Entity Inspector', () => {
		test('entity() returns entity snapshot', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 100, y: 200 });

			const snapshot = debug.inspect.entity(entity);

			expect(snapshot.index).toBe(entity.index);
			expect(snapshot.generation).toBe(entity.generation);
			expect(snapshot.active).toBe(true);
			expect(snapshot.components).toHaveLength(1);
			expect(snapshot.components[0].id).toBe('Position');
			expect(snapshot.components[0].values).toEqual({ x: 100, y: 200 });

			debug.detach();
		});

		test('entities() returns all active entities', () => {
			const debug = attachDebugger(world);

			world.createEntity().addComponent(Position, { x: 1, y: 1 });
			world.createEntity().addComponent(Position, { x: 2, y: 2 });
			world.createEntity().addComponent(Position, { x: 3, y: 3 });

			const snapshots = debug.inspect.entities();

			expect(snapshots).toHaveLength(3);

			debug.detach();
		});

		test('entitiesByComponent() filters by component', () => {
			const debug = attachDebugger(world);

			world.createEntity().addComponent(Position);
			world.createEntity().addComponent(Position);
			world.createEntity().addComponent(Velocity);

			const withPosition = debug.inspect.entitiesByComponent(Position);
			const withVelocity = debug.inspect.entitiesByComponent(Velocity);

			expect(withPosition).toHaveLength(2);
			expect(withVelocity).toHaveLength(1);

			debug.detach();
		});

		test('setValue() modifies entity values', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });

			debug.inspect.setValue(entity, Position, 'x', 999);

			expect(entity.getValue(Position, 'x')).toBe(999);

			debug.detach();
		});

		test('watch() notifies on changes', () => {
			const debug = attachDebugger(world);
			const changes: number[] = [];

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });

			const unwatch = debug.inspect.watch(entity, (snapshot) => {
				changes.push(snapshot.components[0].values.x as number);
			});

			debug.inspect.setValue(entity, Position, 'x', 10);
			debug.inspect.setValue(entity, Position, 'x', 20);

			expect(changes).toEqual([10, 20]);

			// Unwatch stops notifications
			unwatch();
			debug.inspect.setValue(entity, Position, 'x', 30);
			expect(changes).toEqual([10, 20]);

			debug.detach();
		});
	});

	describe('System Profiler', () => {
		test('enable/disable profiling', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			expect(debug.profiler.isEnabled()).toBe(false);

			debug.profiler.enable();
			expect(debug.profiler.isEnabled()).toBe(true);

			debug.profiler.disable();
			expect(debug.profiler.isEnabled()).toBe(false);

			debug.detach();
		});

		test('getMetrics() returns system timing data', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);
			debug.profiler.enable();

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity, { vx: 1, vy: 0 });

			// Run a few frames
			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0);

			const metrics = debug.profiler.getMetrics();

			expect(metrics).toHaveLength(1);
			expect(metrics[0].name).toBe('MovementSystem');
			expect(metrics[0].updateCount).toBe(3);
			expect(metrics[0].avgTime).toBeGreaterThanOrEqual(0);

			debug.detach();
		});

		test('setThreshold() triggers performanceAlert', () => {
			const debug = attachDebugger(world);
			const alerts: string[] = [];

			// Create a slow system
			class SlowSystem extends createSystem({}) {
				update(): void {
					// Simulate slow operation
					const start = performance.now();
					while (performance.now() - start < 5) {
						// busy wait
					}
				}
			}

			world.registerSystem(SlowSystem);
			debug.profiler.enable();
			debug.profiler.setThreshold('SlowSystem', 1); // 1ms threshold

			debug.on('performanceAlert', ({ systemName }) => {
				alerts.push(systemName);
			});

			world.update(1, 0);

			expect(alerts).toContain('SlowSystem');

			debug.detach();
		});
	});

	describe('Query Debugger', () => {
		test('list() returns all queries', () => {
			const debug = attachDebugger(world);

			world.queryManager.registerQuery({ required: [Position] });
			world.queryManager.registerQuery({
				required: [Position, Velocity],
			});

			const queries = debug.queries.list();

			expect(queries.length).toBeGreaterThanOrEqual(2);

			debug.detach();
		});

		test('explainMatch() explains why entity matches', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [Position, Velocity],
			});

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity);

			const explanation = debug.queries.explainMatch(entity, query);

			expect(explanation.matches).toBe(true);
			expect(explanation.requiredCheck.passed).toBe(true);

			debug.detach();
		});

		test('whyNotMatching() returns mismatch reasons', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [Position, Velocity],
			});

			const entity = world.createEntity();
			entity.addComponent(Position);
			// Missing Velocity!

			const reasons = debug.queries.whyNotMatching(entity, query);

			expect(reasons.length).toBeGreaterThan(0);
			expect(reasons[0].type).toBe('missing_required');
			expect(reasons[0].componentId).toBe('Velocity');

			debug.detach();
		});

		test('track() monitors query events', () => {
			const debug = attachDebugger(world);
			const events: string[] = [];

			const query = world.queryManager.registerQuery({
				required: [Position],
			});

			debug.queries.track(query, (event) => {
				events.push(`${event.type}:${event.entity.index}`);
			});

			const entity = world.createEntity();
			entity.addComponent(Position);
			// Should trigger 'qualify'

			entity.removeComponent(Position);
			// Should trigger 'disqualify'

			expect(events).toContain('qualify:0');
			expect(events).toContain('disqualify:0');

			debug.detach();
		});
	});

	describe('Snapshot Manager', () => {
		test('capture() creates snapshot', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 100, y: 200 });

			const snapshot = debug.snapshots.capture('test-snapshot');

			expect(snapshot.id).toBeDefined();
			expect(snapshot.label).toBe('test-snapshot');
			expect(snapshot.entityCount).toBe(1);
			expect(snapshot.entities).toHaveLength(1);
			expect(snapshot.entities[0].components[0].values).toEqual({
				x: 100,
				y: 200,
			});

			debug.detach();
		});

		test('restore() restores world state', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 100, y: 200 });

			const snapshot = debug.snapshots.capture('before');

			// Modify state
			entity.setValue(Position, 'x', 999);
			world.createEntity().addComponent(Velocity);

			// Restore
			debug.snapshots.restore(snapshot);

			// Check restored state
			const entities = debug.inspect.entities();
			expect(entities).toHaveLength(1);
			expect(entities[0].components[0].values.x).toBe(100);

			debug.detach();
		});

		test('diff() compares snapshots', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });

			const before = debug.snapshots.capture();

			entity.setValue(Position, 'x', 100);
			world.createEntity().addComponent(Velocity);

			const after = debug.snapshots.capture();

			const diff = debug.snapshots.diff(before, after);

			expect(diff.entitiesCreated).toContain(1); // New entity
			expect(diff.valuesChanged.length).toBeGreaterThan(0);
			expect(diff.valuesChanged[0].key).toBe('x');
			expect(diff.valuesChanged[0].before).toBe(0);
			expect(diff.valuesChanged[0].after).toBe(100);

			debug.detach();
		});

		test('list/get/delete manage snapshots', () => {
			const debug = attachDebugger(world);

			const snap1 = debug.snapshots.capture('snap1');
			debug.snapshots.capture('snap2');

			expect(debug.snapshots.list()).toHaveLength(2);
			expect(debug.snapshots.get(snap1.id)).toBeDefined();

			debug.snapshots.delete(snap1.id);
			expect(debug.snapshots.list()).toHaveLength(1);
			expect(debug.snapshots.get(snap1.id)).toBeUndefined();

			debug.snapshots.clear();
			expect(debug.snapshots.list()).toHaveLength(0);

			debug.detach();
		});
	});

	describe('Event Timeline', () => {
		test('startRecording/stopRecording controls recording', () => {
			const debug = attachDebugger(world);

			expect(debug.timeline.isRecording()).toBe(false);

			debug.timeline.startRecording();
			expect(debug.timeline.isRecording()).toBe(true);

			debug.timeline.stopRecording();
			expect(debug.timeline.isRecording()).toBe(false);

			debug.detach();
		});

		test('getEvents() returns filtered events', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			// Record some events via the internal API
			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);
			timeline._recordEvent('componentAdded', 0, 'Position');
			timeline._recordEvent('entityCreated', 1);
			timeline._recordEvent('entityDestroyed', 0);

			const allEvents = debug.timeline.getEvents();
			expect(allEvents).toHaveLength(4);

			const createEvents = debug.timeline.getEvents({
				types: ['entityCreated'],
			});
			expect(createEvents).toHaveLength(2);

			const entity0Events = debug.timeline.getEvents({ entityIndex: 0 });
			expect(entity0Events).toHaveLength(3);

			debug.detach();
		});

		test('getStats() returns timeline statistics', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);
			timeline._recordEvent('entityCreated', 1);
			timeline._recordEvent('componentAdded', 0, 'Position');
			timeline._recordEvent('entityDestroyed', 0);

			const stats = debug.timeline.getStats();

			expect(stats.totalEvents).toBe(4);
			expect(stats.entitiesCreated).toBe(2);
			expect(stats.entitiesDestroyed).toBe(1);
			expect(stats.componentAdds).toBe(1);

			debug.detach();
		});

		test('clear() resets timeline', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);
			timeline._recordEvent('entityCreated', 1);

			expect(debug.timeline.getEvents()).toHaveLength(2);

			debug.timeline.clear();

			expect(debug.timeline.getEvents()).toHaveLength(0);
			expect(debug.timeline.getStats().totalEvents).toBe(0);

			debug.detach();
		});

		test('export() returns JSON string', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);

			const json = debug.timeline.export();
			const parsed = JSON.parse(json);

			expect(parsed.events).toHaveLength(1);
			expect(parsed.stats).toBeDefined();

			debug.detach();
		});
	});

	describe('Options', () => {
		test('enableProfiling option auto-enables profiler', () => {
			const debug = attachDebugger(world, { enableProfiling: true });

			expect(debug.profiler.isEnabled()).toBe(true);

			debug.detach();
		});

		test('enableTimeline option auto-starts recording', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			expect(debug.timeline.isRecording()).toBe(true);

			debug.detach();
		});
	});

	describe('Query Debugger - Extended Coverage', () => {
		test('list() includes excluded components', () => {
			const debug = attachDebugger(world);

			// Create a query with excluded components
			world.queryManager.registerQuery({
				required: [Position],
				excluded: [Velocity],
			});

			const queries = debug.queries.list();
			const queryWithExcluded = queries.find((q) =>
				q.excluded.includes('Velocity'),
			);

			expect(queryWithExcluded).toBeDefined();
			expect(queryWithExcluded!.excluded).toContain('Velocity');

			debug.detach();
		});

		test('explainMatch() checks excluded components', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [Position],
				excluded: [Velocity],
			});

			// Entity with excluded component
			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity); // Has excluded!

			const explanation = debug.queries.explainMatch(entity, query);

			expect(explanation.matches).toBe(false);
			expect(explanation.excludedCheck.passed).toBe(false);
			expect(explanation.excludedCheck.details).toHaveLength(1);
			expect(explanation.excludedCheck.details[0].componentId).toBe('Velocity');
			expect(explanation.excludedCheck.details[0].hasIt).toBe(true);

			debug.detach();
		});

		test('whyNotMatching() returns has_excluded reasons', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [Position],
				excluded: [Velocity],
			});

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity); // Has excluded!

			const reasons = debug.queries.whyNotMatching(entity, query);

			expect(reasons.length).toBeGreaterThan(0);
			const excludedReason = reasons.find((r) => r.type === 'has_excluded');
			expect(excludedReason).toBeDefined();
			expect(excludedReason!.componentId).toBe('Velocity');
			expect(excludedReason!.message).toContain('excluded component');

			debug.detach();
		});

		test('track() unsubscribe stops notifications', () => {
			const debug = attachDebugger(world);
			const events: string[] = [];

			const query = world.queryManager.registerQuery({
				required: [Position],
			});

			const unsubscribe = debug.queries.track(query, (event) => {
				events.push(event.type);
			});

			const entity1 = world.createEntity();
			entity1.addComponent(Position);
			expect(events).toContain('qualify');

			// Unsubscribe
			unsubscribe();
			events.length = 0;

			const entity2 = world.createEntity();
			entity2.addComponent(Position);
			expect(events).toHaveLength(0); // No more notifications

			debug.detach();
		});
	});

	describe('Snapshot Manager - Extended Coverage', () => {
		test('enforceMaxSnapshots removes oldest', () => {
			const debug = attachDebugger(world, { maxSnapshots: 3 });

			debug.snapshots.capture('snap1');
			debug.snapshots.capture('snap2');
			debug.snapshots.capture('snap3');
			debug.snapshots.capture('snap4'); // Should remove snap1

			const list = debug.snapshots.list();
			expect(list).toHaveLength(3);
			expect(list.find((s) => s.label === 'snap1')).toBeUndefined();
			expect(list.find((s) => s.label === 'snap4')).toBeDefined();

			debug.detach();
		});

		test('enableAutoCapture/disableAutoCapture work correctly', () => {
			const debug = attachDebugger(world);

			debug.snapshots.enableAutoCapture({ interval: 2, maxSnapshots: 5 });

			// Run frames to trigger auto-capture
			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0); // Should trigger at frame 2
			world.update(1, 0);
			world.update(1, 0); // Should trigger at frame 4

			const autoSnaps = debug.snapshots
				.list()
				.filter((s) => s.label?.startsWith('auto_'));
			expect(autoSnaps.length).toBeGreaterThan(0);

			debug.snapshots.disableAutoCapture();

			// Clear and run more frames
			debug.snapshots.clear();
			world.update(1, 0);
			world.update(1, 0);
			world.update(1, 0);

			const afterDisable = debug.snapshots
				.list()
				.filter((s) => s.label?.startsWith('auto_'));
			expect(afterDisable).toHaveLength(0);

			debug.detach();
		});

		test('auto-capture respects maxSnapshots limit', () => {
			const debug = attachDebugger(world);

			debug.snapshots.enableAutoCapture({ interval: 1, maxSnapshots: 2 });

			// Run many frames
			for (let i = 0; i < 10; i++) {
				world.update(1, 0);
			}

			const autoSnaps = debug.snapshots
				.list()
				.filter((s) => s.label?.startsWith('auto_'));
			expect(autoSnaps.length).toBeLessThanOrEqual(2);

			debug.detach();
		});

		test('diff() detects destroyed entities', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position);

			const before = debug.snapshots.capture();

			entity.destroy();

			const after = debug.snapshots.capture();
			const diff = debug.snapshots.diff(before, after);

			expect(diff.entitiesDestroyed).toContain(entity.index);

			debug.detach();
		});

		test('diff() detects added/removed components', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position);

			const before = debug.snapshots.capture();

			entity.addComponent(Velocity);
			entity.removeComponent(Position);

			const after = debug.snapshots.capture();
			const diff = debug.snapshots.diff(before, after);

			expect(diff.componentsAdded.length).toBeGreaterThan(0);
			expect(diff.componentsRemoved.length).toBeGreaterThan(0);

			debug.detach();
		});

		test('diff() detects new keys in component values', () => {
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });

			const before = debug.snapshots.capture();

			// Change both values
			entity.setValue(Position, 'x', 100);
			entity.setValue(Position, 'y', 200);

			const after = debug.snapshots.capture();
			const diff = debug.snapshots.diff(before, after);

			expect(diff.valuesChanged.length).toBe(2);

			debug.detach();
		});

		test('restore handles globals', () => {
			const debug = attachDebugger(world);

			world.globals.score = 100;
			world.globals.level = 5;

			const snapshot = debug.snapshots.capture();

			world.globals.score = 999;
			world.globals.newKey = 'test';

			debug.snapshots.restore(snapshot);

			expect(world.globals.score).toBe(100);
			expect(world.globals.level).toBe(5);

			debug.detach();
		});
	});

	describe('Timeline - Extended Coverage', () => {
		test('records componentRemoved events', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('componentRemoved', 0, 'Position');

			const stats = debug.timeline.getStats();
			expect(stats.componentRemoves).toBe(1);

			debug.detach();
		});

		test('records valueChanged events', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('valueChanged', 0, 'Position', {
				key: 'x',
				before: 0,
				after: 100,
			});

			const stats = debug.timeline.getStats();
			expect(stats.valueChanges).toBe(1);

			debug.detach();
		});

		test('enforces maxEvents and adjusts stats', () => {
			const debug = attachDebugger(world, {
				enableTimeline: true,
				maxTimelineEvents: 3,
			});

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);
			timeline._recordEvent('entityCreated', 1);
			timeline._recordEvent('entityCreated', 2);
			timeline._recordEvent('entityDestroyed', 0); // Should remove first entityCreated

			const stats = debug.timeline.getStats();
			expect(stats.totalEvents).toBe(3);
			expect(stats.entitiesCreated).toBe(2); // One was removed
			expect(stats.entitiesDestroyed).toBe(1);

			debug.detach();
		});

		test('maxEvents removal adjusts componentAdded stats', () => {
			const debug = attachDebugger(world, {
				enableTimeline: true,
				maxTimelineEvents: 2,
			});

			const timeline = debug.timeline as any;
			timeline._recordEvent('componentAdded', 0, 'Position');
			timeline._recordEvent('componentAdded', 1, 'Velocity');
			timeline._recordEvent('entityCreated', 2); // Removes first componentAdded

			const stats = debug.timeline.getStats();
			expect(stats.componentAdds).toBe(1);

			debug.detach();
		});

		test('maxEvents removal adjusts componentRemoved stats', () => {
			const debug = attachDebugger(world, {
				enableTimeline: true,
				maxTimelineEvents: 2,
			});

			const timeline = debug.timeline as any;
			timeline._recordEvent('componentRemoved', 0, 'Position');
			timeline._recordEvent('componentRemoved', 1, 'Velocity');
			timeline._recordEvent('entityCreated', 2);

			const stats = debug.timeline.getStats();
			expect(stats.componentRemoves).toBe(1);

			debug.detach();
		});

		test('maxEvents removal adjusts valueChanged stats', () => {
			const debug = attachDebugger(world, {
				enableTimeline: true,
				maxTimelineEvents: 2,
			});

			const timeline = debug.timeline as any;
			timeline._recordEvent('valueChanged', 0, 'Position');
			timeline._recordEvent('valueChanged', 1, 'Position');
			timeline._recordEvent('entityCreated', 2);

			const stats = debug.timeline.getStats();
			expect(stats.valueChanges).toBe(1);

			debug.detach();
		});

		test('filter by componentId', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('componentAdded', 0, 'Position');
			timeline._recordEvent('componentAdded', 0, 'Velocity');
			timeline._recordEvent('componentAdded', 1, 'Position');

			const positionEvents = debug.timeline.getEvents({
				componentId: 'Position',
			});
			expect(positionEvents).toHaveLength(2);

			debug.detach();
		});

		test('filter by frameRange', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			// Record at different frames
			world.update(1, 0); // frame 1
			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);

			world.update(1, 0); // frame 2
			timeline._recordEvent('entityCreated', 1);

			world.update(1, 0); // frame 3
			timeline._recordEvent('entityCreated', 2);

			const frame2Events = debug.timeline.getEvents({
				frameRange: { start: 2, end: 2 },
			});
			expect(frame2Events).toHaveLength(1);

			debug.detach();
		});

		test('filter with limit', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);
			timeline._recordEvent('entityCreated', 1);
			timeline._recordEvent('entityCreated', 2);
			timeline._recordEvent('entityCreated', 3);

			const limited = debug.timeline.getEvents({ limit: 2 });
			expect(limited).toHaveLength(2);

			debug.detach();
		});

		test('does not record when not recording', () => {
			const debug = attachDebugger(world); // Timeline not enabled

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityCreated', 0);

			expect(debug.timeline.getEvents()).toHaveLength(0);

			debug.detach();
		});
	});

	describe('Profiler - Extended Coverage', () => {
		test('enable when already enabled is no-op', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			debug.profiler.enable();
			debug.profiler.enable(); // Should not throw

			expect(debug.profiler.isEnabled()).toBe(true);

			debug.detach();
		});

		test('disable when already disabled is no-op', () => {
			const debug = attachDebugger(world);

			debug.profiler.disable();
			debug.profiler.disable(); // Should not throw

			expect(debug.profiler.isEnabled()).toBe(false);

			debug.detach();
		});

		test('getMetrics returns empty metrics for unupdated systems', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);
			// Don't enable profiler or run updates

			const metrics = debug.profiler.getMetrics();

			expect(metrics).toHaveLength(1);
			expect(metrics[0].name).toBe('MovementSystem');
			expect(metrics[0].updateCount).toBe(0);

			debug.detach();
		});

		test('getMetricsFor returns undefined for unknown system', () => {
			const debug = attachDebugger(world);

			// Create a second world with its own system
			const world2 = new World({ checksOn: false });
			class OtherSystem extends createSystem({}) {
				update(): void {}
			}
			world2.registerSystem(OtherSystem);
			const system = world2.getSystem(OtherSystem)!;

			// That system is not in our profiler's world
			const metrics = debug.profiler.getMetricsFor(system);

			expect(metrics).toBeUndefined();

			debug.detach();
		});

		test('getMetricsFor returns metrics for specific system', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);
			debug.profiler.enable();

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity);

			world.update(1, 0);

			const system = world.getSystem(MovementSystem)!;
			const metrics = debug.profiler.getMetricsFor(system);

			expect(metrics).toBeDefined();
			expect(metrics!.name).toBe('MovementSystem');
			expect(metrics!.updateCount).toBe(1);

			debug.detach();
		});

		test('clearThreshold removes threshold', () => {
			const debug = attachDebugger(world);
			const alerts: string[] = [];

			class SlowSystem extends createSystem({}) {
				update(): void {
					const start = performance.now();
					while (performance.now() - start < 3) {}
				}
			}

			world.registerSystem(SlowSystem);
			debug.profiler.enable();
			debug.profiler.setThreshold('SlowSystem', 1);

			debug.on('performanceAlert', ({ systemName }) => {
				alerts.push(systemName);
			});

			world.update(1, 0);
			expect(alerts.length).toBeGreaterThan(0);

			// Clear threshold
			debug.profiler.clearThreshold('SlowSystem');
			alerts.length = 0;

			world.update(1, 0);
			expect(alerts).toHaveLength(0); // No more alerts

			debug.detach();
		});

		test('reset clears all metrics', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);
			debug.profiler.enable();

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity);

			world.update(1, 0);
			world.update(1, 0);

			let metrics = debug.profiler.getMetrics();
			expect(metrics[0].updateCount).toBe(2);

			debug.profiler.reset();

			// After reset, getMetrics still returns systems but with empty metrics
			metrics = debug.profiler.getMetrics();
			expect(metrics[0].updateCount).toBe(0);

			debug.detach();
		});

		test('timing history respects historySize', () => {
			const debug = attachDebugger(world, { profilingHistorySize: 3 });
			world.registerSystem(MovementSystem);
			debug.profiler.enable();

			const entity = world.createEntity();
			entity.addComponent(Position);
			entity.addComponent(Velocity);

			// Run 5 frames
			for (let i = 0; i < 5; i++) {
				world.update(1, 0);
			}

			// avgTime should be based on last 3 timings only
			const metrics = debug.profiler.getMetrics();
			expect(metrics[0].updateCount).toBe(5);
			// avgTime is computed from history which is limited to 3

			debug.detach();
		});
	});

	describe('Event Listener Edge Cases', () => {
		test('listener error does not break other listeners', () => {
			const debug = attachDebugger(world);
			const received: number[] = [];
			const consoleSpy = jest
				.spyOn(console, 'error')
				.mockImplementation(() => {});

			debug.on('frameComplete', () => {
				throw new Error('Intentional test error');
			});

			debug.on('frameComplete', ({ frame }) => {
				received.push(frame);
			});

			world.update(1, 0);

			expect(received).toContain(1);
			expect(consoleSpy).toHaveBeenCalled();

			consoleSpy.mockRestore();
			debug.detach();
		});

		test('unsubscribe from event listener', () => {
			const debug = attachDebugger(world);
			const frames: number[] = [];

			const unsub = debug.on('frameComplete', ({ frame }) => {
				frames.push(frame);
			});

			world.update(1, 0);
			expect(frames).toHaveLength(1);

			unsub();
			world.update(1, 0);
			expect(frames).toHaveLength(1); // No new frames

			debug.detach();
		});

		test('pause when already paused is no-op', () => {
			const debug = attachDebugger(world);
			const events: string[] = [];

			debug.on('pause', () => events.push('pause'));

			debug.pause();
			debug.pause(); // Should not emit again

			expect(events).toHaveLength(1);

			debug.detach();
		});

		test('resume when not paused is no-op', () => {
			const debug = attachDebugger(world);
			const events: string[] = [];

			debug.on('resume', () => events.push('resume'));

			debug.resume(); // Not paused, should not emit

			expect(events).toHaveLength(0);

			debug.detach();
		});
	});

	describe('maxEvents entityDestroyed removal', () => {
		test('maxEvents removal adjusts entityDestroyed stats', () => {
			const debug = attachDebugger(world, {
				enableTimeline: true,
				maxTimelineEvents: 2,
			});

			const timeline = debug.timeline as any;
			timeline._recordEvent('entityDestroyed', 0);
			timeline._recordEvent('entityDestroyed', 1);
			timeline._recordEvent('entityCreated', 2); // Removes first entityDestroyed

			const stats = debug.timeline.getStats();
			expect(stats.entitiesDestroyed).toBe(1);

			debug.detach();
		});
	});

	describe('Query Debugger - Value Predicates', () => {
		const NumComponent = createComponent('NumComponent', {
			value: { type: Types.Float32, default: 0 },
		});

		const TagComponent = createComponent('TagComponent', {
			tag: { type: Types.String, default: '' },
		});

		beforeEach(() => {
			world.registerComponent(NumComponent);
			world.registerComponent(TagComponent);
		});

		test('explainMatch with eq predicate - passing', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [eq(NumComponent, 'value', 100)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 100 });

			const explanation = debug.queries.explainMatch(entity, query);

			expect(explanation.matches).toBe(true);
			expect(explanation.predicateCheck.passed).toBe(true);
			expect(explanation.predicateCheck.details[0].operator).toBe('eq');
			expect(explanation.predicateCheck.details[0].passed).toBe(true);

			debug.detach();
		});

		test('explainMatch with eq predicate - failing', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [eq(NumComponent, 'value', 100)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 50 }); // Wrong value

			const explanation = debug.queries.explainMatch(entity, query);

			expect(explanation.matches).toBe(false);
			expect(explanation.predicateCheck.passed).toBe(false);
			expect(explanation.predicateCheck.details[0].passed).toBe(false);

			debug.detach();
		});

		test('explainMatch with ne predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [ne(NumComponent, 'value', 100)],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(NumComponent, { value: 50 });

			const entityFail = world.createEntity();
			entityFail.addComponent(NumComponent, { value: 100 });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with lt predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [lt(NumComponent, 'value', 50)],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(NumComponent, { value: 30 });

			const entityFail = world.createEntity();
			entityFail.addComponent(NumComponent, { value: 60 });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with le predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [le(NumComponent, 'value', 50)],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(NumComponent, { value: 50 });

			const entityFail = world.createEntity();
			entityFail.addComponent(NumComponent, { value: 51 });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with gt predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [gt(NumComponent, 'value', 50)],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(NumComponent, { value: 60 });

			const entityFail = world.createEntity();
			entityFail.addComponent(NumComponent, { value: 40 });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with ge predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [ge(NumComponent, 'value', 50)],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(NumComponent, { value: 50 });

			const entityFail = world.createEntity();
			entityFail.addComponent(NumComponent, { value: 49 });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with isin predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [TagComponent],
				where: [isin(TagComponent, 'tag', ['a', 'b', 'c'])],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(TagComponent, { tag: 'b' });

			const entityFail = world.createEntity();
			entityFail.addComponent(TagComponent, { tag: 'x' });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('explainMatch with nin predicate', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [TagComponent],
				where: [nin(TagComponent, 'tag', ['x', 'y', 'z'])],
			});

			const entityPass = world.createEntity();
			entityPass.addComponent(TagComponent, { tag: 'a' });

			const entityFail = world.createEntity();
			entityFail.addComponent(TagComponent, { tag: 'x' });

			expect(debug.queries.explainMatch(entityPass, query).matches).toBe(true);
			expect(debug.queries.explainMatch(entityFail, query).matches).toBe(false);

			debug.detach();
		});

		test('whyNotMatching returns eq predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [eq(NumComponent, 'value', 100)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 50 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('expected');
			expect(predicateReason!.suggestion).toContain('100');

			debug.detach();
		});

		test('whyNotMatching returns ne predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [ne(NumComponent, 'value', 100)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 100 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('should not equal');

			debug.detach();
		});

		test('whyNotMatching returns lt predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [lt(NumComponent, 'value', 50)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 60 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('not <');
			expect(predicateReason!.suggestion).toContain('less than');

			debug.detach();
		});

		test('whyNotMatching returns le predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [le(NumComponent, 'value', 50)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 60 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('not <=');
			expect(predicateReason!.suggestion).toContain('or less');

			debug.detach();
		});

		test('whyNotMatching returns gt predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [gt(NumComponent, 'value', 50)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 40 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('not >');
			expect(predicateReason!.suggestion).toContain('greater than');

			debug.detach();
		});

		test('whyNotMatching returns ge predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [NumComponent],
				where: [ge(NumComponent, 'value', 50)],
			});

			const entity = world.createEntity();
			entity.addComponent(NumComponent, { value: 40 });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('not >=');
			expect(predicateReason!.suggestion).toContain('or greater');

			debug.detach();
		});

		test('whyNotMatching returns isin predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [TagComponent],
				where: [isin(TagComponent, 'tag', ['a', 'b'])],
			});

			const entity = world.createEntity();
			entity.addComponent(TagComponent, { tag: 'x' });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('not in');
			expect(predicateReason!.suggestion).toContain('one of');

			debug.detach();
		});

		test('whyNotMatching returns nin predicate failure reason', () => {
			const debug = attachDebugger(world);

			const query = world.queryManager.registerQuery({
				required: [TagComponent],
				where: [nin(TagComponent, 'tag', ['x', 'y'])],
			});

			const entity = world.createEntity();
			entity.addComponent(TagComponent, { tag: 'x' });

			const reasons = debug.queries.whyNotMatching(entity, query);

			const predicateReason = reasons.find(
				(r) => r.type === 'predicate_failed',
			);
			expect(predicateReason).toBeDefined();
			expect(predicateReason!.message).toContain('should not be in');
			expect(predicateReason!.suggestion).toContain('not in');

			debug.detach();
		});
	});

	describe('Edge Cases - Remaining Coverage', () => {
		test('timeline getStats with single event frame', () => {
			const debug = attachDebugger(world, { enableTimeline: true });

			// Record event at a single frame
			const timeline = debug.timeline as any;
			world.update(1, 0); // frame 1
			timeline._recordEvent('entityCreated', 0);

			const stats = debug.timeline.getStats();

			// With one event at one frame, framesRecorded should be 1
			expect(stats.framesRecorded).toBe(1);
			expect(stats.totalEvents).toBe(1);

			debug.detach();
		});

		test('profiler enable twice does not re-patch systems', () => {
			const debug = attachDebugger(world);
			world.registerSystem(MovementSystem);

			debug.profiler.enable();
			const system1 = world.getSystem(MovementSystem)!;
			const update1 = system1.update;

			debug.profiler.enable(); // Should early return
			const update2 = system1.update;

			// The update method should be the same (not re-wrapped)
			expect(update1).toBe(update2);

			debug.detach();
		});

		test('snapshot captures array values correctly', () => {
			// Create component with array-like data (Object type can store arrays)
			const ArrayComponent = createComponent('ArrayComponent', {
				data: { type: Types.Object, default: [] },
			});
			world.registerComponent(ArrayComponent);

			const debug = attachDebugger(world);
			const entity = world.createEntity();
			entity.addComponent(ArrayComponent, { data: [1, 2, 3] });

			const snapshot = debug.snapshots.capture();

			// Verify the snapshot captured the array
			const entitySnap = snapshot.entities.find(
				(e) => e.index === entity.index,
			);
			expect(entitySnap).toBeDefined();

			const compSnap = entitySnap!.components.find(
				(c) => c.id === 'ArrayComponent',
			);
			expect(compSnap).toBeDefined();
			expect(compSnap!.values.data).toEqual([1, 2, 3]);

			debug.detach();
		});

		test('snapshot captures object values correctly', () => {
			// Create component with object data
			const ObjectComponent = createComponent('ObjectComponent', {
				data: { type: Types.Object, default: {} },
			});
			world.registerComponent(ObjectComponent);

			const debug = attachDebugger(world);
			const entity = world.createEntity();
			entity.addComponent(ObjectComponent, { data: { nested: { value: 42 } } });

			const snapshot = debug.snapshots.capture();

			const entitySnap = snapshot.entities.find(
				(e) => e.index === entity.index,
			);
			expect(entitySnap).toBeDefined();

			const compSnap = entitySnap!.components.find(
				(c) => c.id === 'ObjectComponent',
			);
			expect(compSnap).toBeDefined();
			expect(compSnap!.values.data).toEqual({ nested: { value: 42 } });

			debug.detach();
		});

		test('diff detects new keys added to component', () => {
			// This is tricky to test since schemas are fixed
			// But we can test the diff logic by manipulating snapshots
			const debug = attachDebugger(world);

			const entity = world.createEntity();
			entity.addComponent(Position, { x: 0, y: 0 });

			// Capture before
			const before = debug.snapshots.capture();

			// Modify the before snapshot to simulate a schema without 'y'
			const beforeEntity = before.entities.find(
				(e) => e.index === entity.index,
			);
			const beforeComp = beforeEntity!.components.find(
				(c) => c.id === 'Position',
			);
			delete (beforeComp!.values as any).y;

			// After snapshot has 'y' key
			const after = debug.snapshots.capture();

			const diff = debug.snapshots.diff(before, after);

			// Should detect the 'new' y key
			const yChange = diff.valuesChanged.find(
				(v) => v.componentId === 'Position' && v.key === 'y',
			);
			expect(yChange).toBeDefined();
			expect(yChange!.before).toBeUndefined();
			expect(yChange!.after).toBe(0);

			debug.detach();
		});

		test('enableAutoCapture uses defaults when options not provided', () => {
			const debug = attachDebugger(world);

			// Call with empty options to use defaults
			debug.snapshots.enableAutoCapture({});

			// Run enough frames to trigger auto-capture (default interval is 60)
			for (let i = 0; i < 65; i++) {
				world.update(1, 0);
			}

			const autoSnaps = debug.snapshots
				.list()
				.filter((s) => s.label?.startsWith('auto_'));
			expect(autoSnaps.length).toBeGreaterThan(0);

			debug.detach();
		});

		test('auto-capture respects maxSnapshots from options', () => {
			const debug = attachDebugger(world);

			// Don't specify maxSnapshots in options - should use debugger's maxSnapshots
			debug.snapshots.enableAutoCapture({ interval: 1 });

			// Run frames
			for (let i = 0; i < 5; i++) {
				world.update(1, 0);
			}

			const autoSnaps = debug.snapshots
				.list()
				.filter((s) => s.label?.startsWith('auto_'));
			expect(autoSnaps.length).toBeGreaterThan(0);

			debug.detach();
		});

		test('auto-capture only counts auto_ prefixed snapshots for limit', () => {
			const debug = attachDebugger(world);

			// Create some manual snapshots first (no auto_ prefix)
			debug.snapshots.capture('manual1');
			debug.snapshots.capture('manual2');
			debug.snapshots.capture(); // No label

			// Enable auto-capture with low limit
			debug.snapshots.enableAutoCapture({ interval: 1, maxSnapshots: 2 });

			// Run frames to trigger auto-capture
			for (let i = 0; i < 5; i++) {
				world.update(1, 0);
			}

			// Manual snapshots should still be there
			const allSnaps = debug.snapshots.list();
			const manualSnaps = allSnaps.filter(
				(s) => !s.label || !s.label.startsWith('auto_'),
			);
			expect(manualSnaps.length).toBe(3);

			// Auto snapshots limited to 2
			const autoSnaps = allSnaps.filter((s) => s.label?.startsWith('auto_'));
			expect(autoSnaps.length).toBeLessThanOrEqual(2);

			debug.detach();
		});
	});
});

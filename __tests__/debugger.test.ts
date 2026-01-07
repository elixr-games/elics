import { World } from '../src/world';
import { createComponent } from '../src/component';
import { createSystem } from '../src/system';
import { Types } from '../src/types';
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
});

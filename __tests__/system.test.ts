import { Types } from '../src/types';
import { World } from '../src/world';
import { createComponent } from '../src/component';
import { createSystem } from '../src/system';

// Define components for testing
const PositionComponent = createComponent('Position', {
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const VelocityComponent = createComponent('Velocity', {
	velocity: { type: Types.Vec2, default: [0, 0] },
});

const HealthComponent = createComponent('Health', {
	value: { type: Types.Int16, default: 100 },
});

// Define systems for testing
class MovementSystem extends createSystem({
	movingEntities: {
		required: [PositionComponent, VelocityComponent],
	},
}) {
	init(): void {}

	update(delta: number): void {
		for (const entity of this.queries.movingEntities.entities) {
			// Use getValue and getVectorView methods
			const posX = entity.getValue(PositionComponent, 'x')!;
			const posY = entity.getValue(PositionComponent, 'y')!;

			const velocity = entity.getVectorView(VelocityComponent, 'velocity');

			// Update positions
			entity.setValue(PositionComponent, 'x', posX + velocity[0] * delta);
			entity.setValue(PositionComponent, 'y', posY + velocity[1] * delta);
		}
	}
}

class HealthSystem extends createSystem(
	{
		entitiesWithHealth: {
			required: [HealthComponent],
		},
	},
	{
		healthDecreaseRate: { type: Types.Int16, default: 10 },
	},
) {
	update(delta: number): void {
		for (const entity of this.queries.entitiesWithHealth.entities) {
			const healthValue: number = entity.getValue(HealthComponent, 'value')!;
			entity.setValue(
				HealthComponent,
				'value',
				healthValue - this.config.healthDecreaseRate.value * delta,
			);
		}
	}
}

describe('System Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);

		world.globals['gravity'] = 9.81;
	});

	test('Globals accessable in systems', () => {
		class TestSystem extends createSystem() {
			init(): void {}

			update(): void {
				const gravity = this.globals['gravity'];
				expect(gravity).toBe(9.81);
			}
		}

		world.registerSystem(TestSystem);
		world.update(0, 1);
	});

	test('Registering and unregistering systems', () => {
		const initCallback = jest.fn();
		const destroyCallback = jest.fn();
		class TestSystem extends createSystem() {
			init(): void {
				initCallback();
			}

			destroy(): void {
				destroyCallback();
			}
		}

		world.registerSystem(TestSystem);
		const system = world.getSystem(TestSystem);
		expect(system).toBeDefined();
		expect(world.getSystems()).toContain(system);
		expect(initCallback).toHaveBeenCalledTimes(1);
		expect(destroyCallback).toHaveBeenCalledTimes(0);

		world.unregisterSystem(TestSystem);
		expect(world.getSystem(TestSystem)).toBeUndefined();
		expect(destroyCallback).toHaveBeenCalledTimes(1);
	});

	test('System execution ordering', () => {
		class FirstSystem extends createSystem() {
			update(): void {
				executionOrder.push('FirstSystem');
			}
		}

		class SecondSystem extends createSystem() {
			update(): void {
				executionOrder.push('SecondSystem');
			}
		}

		const executionOrder: string[] = [];

		world.registerSystem(SecondSystem, { priority: 1 }); // Higher priority
		world.registerSystem(FirstSystem, { priority: 0 }); // Lower priority

		world.update(0, 1);

		expect(executionOrder).toEqual(['FirstSystem', 'SecondSystem']);
	});

	test('System updates entities correctly', () => {
		world.registerSystem(MovementSystem);
		const entity = world.createEntity();
		entity.addComponent(PositionComponent, { x: 0, y: 0 });
		entity.addComponent(VelocityComponent, { velocity: [1, 1] });

		world.update(1, 1); // delta = 1

		expect(entity.getValue(PositionComponent, 'x')).toBe(1);
		expect(entity.getValue(PositionComponent, 'y')).toBe(1);
	});

	test('System pausing and resuming', () => {
		class TestSystem extends createSystem() {
			public executed = false;

			update(): void {
				this.executed = true;
			}
		}

		world.registerSystem(TestSystem);
		const system = world.getSystem(TestSystem) as TestSystem;

		// Initially, the system should execute
		system!.executed = false;
		world.update(0, 1);
		expect(system!.executed).toBe(true);

		// Pause the system
		system?.stop();

		// System should not execute when paused
		system!.executed = false;
		world.update(0, 1);
		expect(system!.executed).toBe(false);

		// Resume the system
		system?.play();

		// System should execute again
		system!.executed = false;
		world.update(0, 1);
		expect(system!.executed).toBe(true);
	});

	test('HealthSystem decreases health over time', () => {
		world.registerSystem(HealthSystem);
		const entity = world.createEntity();
		entity.addComponent(HealthComponent);

		expect(entity.getValue(HealthComponent, 'value')).toBe(100); // Initial health

		world.update(1, 1); // delta = 1
		expect(entity.getValue(HealthComponent, 'value')).toBe(90);

		world.update(2, 1); // delta = 2
		expect(entity.getValue(HealthComponent, 'value')).toBe(70);
	});

	test('HealthSystem decreases health at correct rate', () => {
		world.registerSystem(HealthSystem, {
			configData: { healthDecreaseRate: 20 },
		});
		const entity = world.createEntity();
		entity.addComponent(HealthComponent);

		expect(entity.getValue(HealthComponent, 'value')).toBe(100); // Initial health

		world.update(1, 1); // delta = 1
		expect(entity.getValue(HealthComponent, 'value')).toBe(80);

		world.update(2, 1); // delta = 2
		expect(entity.getValue(HealthComponent, 'value')).toBe(40);
	});

	test('System config signals funcion correctly', () => {
		world.registerSystem(HealthSystem, {
			configData: { healthDecreaseRate: 20 },
		});
		const valueChangeCallback = jest.fn();
		const systemInstance = world.getSystem(HealthSystem);
		expect(systemInstance).toBeDefined();
		systemInstance!.config.healthDecreaseRate.subscribe(valueChangeCallback);
		systemInstance!.config.healthDecreaseRate.value = 40;
		expect(valueChangeCallback).toHaveBeenCalledWith(40);
	});

	test('Default system methods execute', () => {
		class DefaultSystem extends createSystem() {}
		world.registerSystem(DefaultSystem);
		world.update(0, 0);
		world.unregisterSystem(DefaultSystem);
	});

	test('Systems can create entities', () => {
		class EntityCreatorSystem extends createSystem() {
			public createdEntity: any = null;

			init(): void {
				this.createdEntity = this.createEntity();
			}
		}

		world.registerSystem(EntityCreatorSystem);
		const system = world.getSystem(EntityCreatorSystem) as EntityCreatorSystem;

		expect(system.createdEntity).toBeDefined();
		expect(system.createdEntity.index).toBeGreaterThanOrEqual(0);
		expect(system.createdEntity.active).toBe(true);
	});

	test('Registering duplicate system logs warning and skips registration', () => {
		class DuplicateTestSystem extends createSystem() {}

		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		// Register the system first time
		world.registerSystem(DuplicateTestSystem);
		expect(world.hasSystem(DuplicateTestSystem)).toBe(true);

		// Try to register the same system again
		world.registerSystem(DuplicateTestSystem);

		// Should have logged a warning
		expect(consoleSpy).toHaveBeenCalledWith(
			'System DuplicateTestSystem is already registered, skipping registration.',
		);

		// Should still only have one instance
		expect(
			world.getSystems().filter((s) => s instanceof DuplicateTestSystem),
		).toHaveLength(1);

		consoleSpy.mockRestore();
	});

	test('Unregistering non-existent system is a no-op', () => {
		class NonExistentSystem extends createSystem() {}
		expect(() => world.unregisterSystem(NonExistentSystem)).not.toThrow();
		expect(world.hasSystem(NonExistentSystem)).toBe(false);
	});

	test('Systems with equal priority maintain registration order', () => {
		const executionOrder: string[] = [];

		class SystemA extends createSystem() {
			update(): void {
				executionOrder.push('A');
			}
		}
		class SystemB extends createSystem() {
			update(): void {
				executionOrder.push('B');
			}
		}
		class SystemC extends createSystem() {
			update(): void {
				executionOrder.push('C');
			}
		}

		// All registered with same priority (default 0)
		world.registerSystem(SystemA);
		world.registerSystem(SystemB);
		world.registerSystem(SystemC);

		world.update(0, 1);

		expect(executionOrder).toEqual(['A', 'B', 'C']);
	});

	test('Negative priority values order correctly', () => {
		const executionOrder: string[] = [];

		class NegativeSystem extends createSystem() {
			update(): void {
				executionOrder.push('Negative');
			}
		}
		class ZeroSystem extends createSystem() {
			update(): void {
				executionOrder.push('Zero');
			}
		}
		class PositiveSystem extends createSystem() {
			update(): void {
				executionOrder.push('Positive');
			}
		}

		world.registerSystem(PositiveSystem, { priority: 10 });
		world.registerSystem(NegativeSystem, { priority: -10 });
		world.registerSystem(ZeroSystem, { priority: 0 });

		world.update(0, 1);

		expect(executionOrder).toEqual(['Negative', 'Zero', 'Positive']);
	});

	test('System config supports multiple schema types', () => {
		class MultiConfigSystem extends createSystem(
			{},
			{
				intVal: { type: Types.Int16, default: 0 },
				floatVal: { type: Types.Float32, default: 0.0 },
				boolVal: { type: Types.Boolean, default: false },
				strVal: { type: Types.String, default: '' },
			},
		) {}

		world.registerSystem(MultiConfigSystem, {
			configData: {
				intVal: 42,
				floatVal: 3.14,
				boolVal: true,
				strVal: 'test',
			},
		});

		const sys = world.getSystem(MultiConfigSystem);
		expect(sys!.config.intVal.value).toBe(42);
		expect(sys!.config.floatVal.value).toBeCloseTo(3.14, 2);
		expect(sys!.config.boolVal.value).toBe(true);
		expect(sys!.config.strVal.value).toBe('test');
	});

	test('System destroy callback is invoked before removal', () => {
		const calls: string[] = [];

		class TrackedSystem extends createSystem() {
			destroy(): void {
				// At destroy time, we should still be in the systems list
				calls.push('destroy');
			}
		}

		world.registerSystem(TrackedSystem);
		expect(world.hasSystem(TrackedSystem)).toBe(true);

		world.unregisterSystem(TrackedSystem);
		expect(calls).toEqual(['destroy']);
		expect(world.hasSystem(TrackedSystem)).toBe(false);
	});

	test('System can modify entities during update', () => {
		class SpawnerSystem extends createSystem({
			targets: { required: [PositionComponent] },
		}) {
			public spawnedEntity: any = null;

			update(): void {
				// Create a new entity during update
				this.spawnedEntity = this.createEntity();
				this.spawnedEntity.addComponent(PositionComponent, { x: 99, y: 99 });
			}
		}

		world.registerSystem(SpawnerSystem);
		const system = world.getSystem(SpawnerSystem) as SpawnerSystem;

		world.update(0, 1);

		expect(system.spawnedEntity).toBeDefined();
		expect(system.spawnedEntity.getValue(PositionComponent, 'x')).toBe(99);
	});

	test('System with empty queries object works', () => {
		class EmptyQuerySystem extends createSystem({}) {
			public updated = false;

			update(): void {
				this.updated = true;
			}
		}

		world.registerSystem(EmptyQuerySystem);
		const sys = world.getSystem(EmptyQuerySystem) as EmptyQuerySystem;

		world.update(0, 1);
		expect(sys.updated).toBe(true);
	});
});

import { World } from '../src/world';
import { createComponent } from '../src/component';
import { createSystem } from '../src/system';
import { Types } from '../src/types';

// Define components for testing
const PositionComponent = createComponent({
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const VelocityComponent = createComponent({
	velocity: { type: Types.Vec2, default: [0, 0] },
});

const HealthComponent = createComponent({
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
			const posX = entity.getValue(PositionComponent, 'x');
			const posY = entity.getValue(PositionComponent, 'y');

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
			const healthValue = entity.getValue(HealthComponent, 'value');
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
});

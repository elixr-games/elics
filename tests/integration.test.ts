import { Component } from '../src/Component';
import { System } from '../src/System';
import { Types } from '../src/Types';
import { World } from '../src/World';

// Define some components for testing
class PositionComponent extends Component {
	static schema = {
		x: { type: Types.Float32, default: 0 },
		y: { type: Types.Float32, default: 0 },
	};
}

class VelocityComponent extends Component {
	static schema = {
		vx: { type: Types.Float32, default: 0 },
		vy: { type: Types.Float32, default: 0 },
	};
}

class HealthComponent extends Component {
	static schema = {
		value: { type: Types.Int16, default: 100 },
	};
}

// Define systems for testing
class MovementSystem extends System {
	static queries = {
		movingEntities: {
			required: [PositionComponent, VelocityComponent],
		},
	};

	update(delta: number): void {
		const entities = this.getEntities(this.queries.movingEntities);
		const posX = PositionComponent.typedArrays['x'];
		const posY = PositionComponent.typedArrays['y'];
		const velX = VelocityComponent.typedArrays['vx'];
		const velY = VelocityComponent.typedArrays['vy'];

		for (const entity of entities) {
			const index = entity.index;
			posX[index] += velX[index] * delta;
			posY[index] += velY[index] * delta;
		}
	}
}

class HealthSystem extends System {
	static queries = {
		entitiesWithHealth: {
			required: [HealthComponent],
		},
	};

	update(delta: number): void {
		const entities = this.getEntities(this.queries.entitiesWithHealth);
		const health = HealthComponent.typedArrays['value'];

		for (const entity of entities) {
			const index = entity.index;
			health[index] -= 10 * delta; // Decrease health over time
		}
	}
}

// Jest tests
describe('EliCS Integration Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World(1000);
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);
	});

	// Entity Tests
	describe('Entity Tests', () => {
		test('Entity creation', () => {
			const entity = world.createEntity();
			expect(entity).toBeDefined();
			expect(entity.active).toBe(true);
		});

		test('Adding multiple components at once', () => {
			const entity = world.createEntity();

			entity.addComponent(PositionComponent, { x: 10, y: 20 });
			entity.addComponent(VelocityComponent, { vx: 5, vy: 5 });

			expect(entity.hasComponent(PositionComponent)).toBe(true);
			expect(entity.hasComponent(VelocityComponent)).toBe(true);

			const index = entity.index;
			expect(PositionComponent.typedArrays['x'][index]).toBe(10);
			expect(PositionComponent.typedArrays['y'][index]).toBe(20);
			expect(VelocityComponent.typedArrays['vx'][index]).toBe(5);
			expect(VelocityComponent.typedArrays['vy'][index]).toBe(5);
		});

		test('Removing components', () => {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			expect(entity.hasComponent(PositionComponent)).toBe(true);

			entity.removeComponent(PositionComponent);
			expect(entity.hasComponent(PositionComponent)).toBe(false);
		});

		test('Entity destruction and reuse', () => {
			const entity = world.createEntity();
			const index = entity.index;
			entity.destroy();

			expect(entity.active).toBe(false);

			// Create a new entity, which should reuse the destroyed one
			const newEntity = world.createEntity();
			expect(newEntity.index).toBe(index);
			expect(newEntity.active).toBe(true);
		});
	});

	// Component Tests
	describe('Component Tests', () => {
		test('Add and remove components', () => {
			const entity = world.createEntity();

			entity.addComponent(PositionComponent, { x: 10, y: 20 });
			expect(entity.hasComponent(PositionComponent)).toBe(true);

			entity.removeComponent(PositionComponent);
			expect(entity.hasComponent(PositionComponent)).toBe(false);
		});

		test('Component data access', () => {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent, { x: 5, y: 15 });

			const index = entity.index;
			const posX = PositionComponent.typedArrays['x'];
			const posY = PositionComponent.typedArrays['y'];

			expect(posX[index]).toBe(5);
			expect(posY[index]).toBe(15);

			// Update component data
			posX[index] = 25;
			posY[index] = 35;

			expect(posX[index]).toBe(25);
			expect(posY[index]).toBe(35);
		});

		test('Component default values', () => {
			const entity = world.createEntity();
			entity.addComponent(HealthComponent);

			const index = entity.index;
			const health = HealthComponent.typedArrays['value'];

			expect(health[index]).toBe(100); // Default value
		});
	});

	// Query Tests
	describe('Query Tests', () => {
		test('Querying entities with required components', () => {
			const queryConfig = {
				required: [PositionComponent, VelocityComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);

			const entity1 = world.createEntity();
			entity1.addComponent(PositionComponent);
			entity1.addComponent(VelocityComponent);

			const entity2 = world.createEntity();
			entity2.addComponent(PositionComponent);

			const entities = world.queryManager.getEntities(query);

			expect(entities).toContain(entity1);
			expect(entities).not.toContain(entity2);
		});

		test('Querying entities with excluded components', () => {
			const queryConfig = {
				required: [PositionComponent],
				excluded: [HealthComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);

			const entity1 = world.createEntity();
			entity1.addComponent(PositionComponent);

			const entity2 = world.createEntity();
			entity2.addComponent(PositionComponent);
			entity2.addComponent(HealthComponent);

			const entities = world.queryManager.getEntities(query);

			expect(entities).toContain(entity1);
			expect(entities).not.toContain(entity2);
		});

		test('Querying entities with both required and excluded components', () => {
			const queryConfig = {
				required: [PositionComponent],
				excluded: [VelocityComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);

			const entity1 = world.createEntity();
			entity1.addComponent(PositionComponent);
			entity1.addComponent(VelocityComponent);

			const entity2 = world.createEntity();
			entity2.addComponent(PositionComponent);
			entity2.addComponent(HealthComponent);

			const entities = world.queryManager.getEntities(query);

			expect(entities).toContain(entity2);
			expect(entities).not.toContain(entity1);
		});

		test('Multiple queries with overlapping components', () => {
			const queryConfig1 = {
				required: [PositionComponent, HealthComponent],
			};

			const queryConfig2 = {
				required: [VelocityComponent, HealthComponent],
			};

			const query1 = world.queryManager.registerQuery(queryConfig1);
			const query2 = world.queryManager.registerQuery(queryConfig2);

			const entity1 = world.createEntity();
			entity1.addComponent(PositionComponent);
			entity1.addComponent(HealthComponent);

			const entity2 = world.createEntity();
			entity2.addComponent(VelocityComponent);
			entity2.addComponent(HealthComponent);

			const entities1 = world.queryManager.getEntities(query1);
			const entities2 = world.queryManager.getEntities(query2);

			expect(entities1).toContain(entity1);
			expect(entities1).not.toContain(entity2);

			expect(entities2).toContain(entity2);
			expect(entities2).not.toContain(entity1);
		});

		test('Removing components affects query results', () => {
			const queryConfig = {
				required: [PositionComponent, VelocityComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			entity.addComponent(VelocityComponent);

			let entities = world.queryManager.getEntities(query);

			expect(entities).toContain(entity);

			// Remove a component
			entity.removeComponent(VelocityComponent);
			entities = world.queryManager.getEntities(query);

			expect(entities).not.toContain(entity);
		});
	});

	// System Tests
	describe('System Tests', () => {
		test('System execution ordering', () => {
			class FirstSystem extends System {
				static queries = {};
				update(): void {
					executionOrder.push('FirstSystem');
				}
			}

			class SecondSystem extends System {
				static queries = {};
				update(): void {
					executionOrder.push('SecondSystem');
				}
			}

			const executionOrder: string[] = [];

			world.registerSystem(SecondSystem, 1); // Higher priority
			world.registerSystem(FirstSystem, 0); // Lower priority

			world.update(0, 0);

			expect(executionOrder).toEqual(['FirstSystem', 'SecondSystem']);
		});

		test('System updates entities correctly', () => {
			world.registerSystem(MovementSystem);
			const entity = world.createEntity();
			entity.addComponent(PositionComponent, { x: 0, y: 0 });
			entity.addComponent(VelocityComponent, { vx: 1, vy: 1 });

			world.update(1, 1); // delta = 1

			const index = entity.index;
			const posX = PositionComponent.typedArrays['x'];
			const posY = PositionComponent.typedArrays['y'];

			expect(posX[index]).toBe(1);
			expect(posY[index]).toBe(1);
		});

		test('System pausing and resuming', () => {
			class TestSystem extends System {
				static queries = {};
				public executed = false;

				update(): void {
					this.executed = true;
				}
			}

			world.registerSystem(TestSystem);
			const system = world.getSystem(TestSystem);

			// Initially, the system should execute
			system!.executed = false;
			world.update(0, 0);
			expect(system!.executed).toBe(true);

			// Pause the system
			system?.stop();

			// System should not execute when paused
			system!.executed = false;
			world.update(0, 0);
			expect(system!.executed).toBe(false);

			// Resume the system
			system?.play();

			// System should execute again
			system!.executed = false;
			world.update(0, 0);
			expect(system!.executed).toBe(true);
		});

		test('HealthSystem decreases health over time', () => {
			world.registerSystem(HealthSystem);
			const entity = world.createEntity();
			entity.addComponent(HealthComponent);

			const index = entity.index;
			const health = HealthComponent.typedArrays['value'];

			expect(health[index]).toBe(100); // Initial health

			world.update(1, 1); // delta = 1
			expect(health[index]).toBe(90);

			world.update(2, 1); // delta = 2
			expect(health[index]).toBe(70);
		});
	});

	// Overall Tests
	describe('Overall ECS Functionality', () => {
		test('Integration test with multiple systems and components', () => {
			world.registerSystem(MovementSystem);
			world.registerSystem(HealthSystem);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent, { x: 0, y: 0 });
			entity.addComponent(VelocityComponent, { vx: 2, vy: 3 });
			entity.addComponent(HealthComponent);

			const posX = PositionComponent.typedArrays['x'];
			const posY = PositionComponent.typedArrays['y'];
			const health = HealthComponent.typedArrays['value'];

			const index = entity.index;

			// Initial state
			expect(posX[index]).toBe(0);
			expect(posY[index]).toBe(0);
			expect(health[index]).toBe(100);

			// First update
			world.update(1, 1); // delta = 1
			expect(posX[index]).toBe(2);
			expect(posY[index]).toBe(3);
			expect(health[index]).toBe(90);

			// Second update
			world.update(1, 1); // delta = 1
			expect(posX[index]).toBe(4);
			expect(posY[index]).toBe(6);
			expect(health[index]).toBe(80);

			// Remove HealthComponent
			entity.removeComponent(HealthComponent);

			// Third update
			world.update(1, 1); // delta = 1
			expect(posX[index]).toBe(6);
			expect(posY[index]).toBe(9);
			// Health should remain the same since HealthComponent was removed
			expect(health[index]).toBe(80); // No further decrease
		});
	});
});

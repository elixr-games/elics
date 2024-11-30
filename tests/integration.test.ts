import { Component } from '../src/Component';
import { System } from '../src/System';
import { Types } from '../src/Types';
import { World } from '../src/World';

// Define components for testing
class PositionComponent extends Component {
	static schema = {
		x: { type: Types.Float32, default: 0 },
		y: { type: Types.Float32, default: 0 },
	};
}
class VelocityComponent extends Component {
	static schema = {
		velocity: { type: Types.Vec2, default: [0, 0] },
	};
}

class HealthComponent extends Component {
	static schema = {
		value: { type: Types.Int16, default: 100 },
	};
}

class VectorComponent extends Component {
	static schema = {
		position: { type: Types.Vec3, default: [0, 0, 0] },
	};
}

class NameComponent extends Component {
	static schema = {
		name: { type: Types.String, default: '' },
	};
}

class CustomDataComponent extends Component {
	static schema = {
		data: { type: Types.Object, default: null },
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

		for (const entity of entities) {
			// Use getValue and getVectorView methods
			const posX = entity.getValue(PositionComponent, 'x') as number;
			const posY = entity.getValue(PositionComponent, 'y') as number;

			const velocity = entity.getVectorView(VelocityComponent, 'velocity');

			// Update positions
			entity.setValue(PositionComponent, 'x', posX + velocity[0] * delta);
			entity.setValue(PositionComponent, 'y', posY + velocity[1] * delta);
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

		for (const entity of entities) {
			const healthValue = entity.getValue(HealthComponent, 'value') as number;
			entity.setValue(HealthComponent, 'value', healthValue - 10 * delta);
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
		world.registerComponent(VectorComponent);
		world.registerComponent(NameComponent);
		world.registerComponent(CustomDataComponent);
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
			entity.addComponent(VelocityComponent, { velocity: [5, 5] });

			expect(entity.hasComponent(PositionComponent)).toBe(true);
			expect(entity.hasComponent(VelocityComponent)).toBe(true);

			// Use getValue and getVectorView
			expect(entity.getValue(PositionComponent, 'x')).toBe(10);
			expect(entity.getValue(PositionComponent, 'y')).toBe(20);

			const velocity = entity.getVectorView(VelocityComponent, 'velocity');
			expect(velocity[0]).toBe(5);
			expect(velocity[1]).toBe(5);
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

			// Use getValue and setValue
			expect(entity.getValue(PositionComponent, 'x')).toBe(5);
			expect(entity.getValue(PositionComponent, 'y')).toBe(15);

			// Update component data
			entity.setValue(PositionComponent, 'x', 25);
			entity.setValue(PositionComponent, 'y', 35);

			expect(entity.getValue(PositionComponent, 'x')).toBe(25);
			expect(entity.getValue(PositionComponent, 'y')).toBe(35);
		});

		test('Component default values', () => {
			const entity = world.createEntity();
			entity.addComponent(HealthComponent);

			expect(entity.getValue(HealthComponent, 'value')).toBe(100); // Default value
		});

		test('Vec3 component data access', () => {
			const entity = world.createEntity();
			entity.addComponent(VectorComponent, { position: [1.0, 2.0, 3.0] });

			const position = entity.getVectorView(VectorComponent, 'position');

			expect(position[0]).toBe(1.0);
			expect(position[1]).toBe(2.0);
			expect(position[2]).toBe(3.0);

			// Update component data
			position[0] = 4.0;
			position[1] = 5.0;
			position[2] = 6.0;

			expect(position[0]).toBe(4.0);
			expect(position[1]).toBe(5.0);
			expect(position[2]).toBe(6.0);
		});

		test('String component data access', () => {
			const entity = world.createEntity();
			entity.addComponent(NameComponent, { name: 'TestEntity' });

			expect(entity.getValue(NameComponent, 'name')).toBe('TestEntity');

			// Update component data
			entity.setValue(NameComponent, 'name', 'UpdatedEntity');

			expect(entity.getValue(NameComponent, 'name')).toBe('UpdatedEntity');
		});

		test('Object component data access', () => {
			const entity = world.createEntity();
			const initialData = { key: 'value' };
			entity.addComponent(CustomDataComponent, { data: initialData });

			expect(entity.getValue(CustomDataComponent, 'data')).toEqual(initialData);

			// Update component data
			const newData = { newKey: 'newValue' };
			entity.setValue(CustomDataComponent, 'data', newData);

			expect(entity.getValue(CustomDataComponent, 'data')).toEqual(newData);
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
	});

	// Overall Tests
	describe('Overall ECS Functionality', () => {
		test('Integration test with multiple systems and components', () => {
			world.registerSystem(MovementSystem);
			world.registerSystem(HealthSystem);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent, { x: 0, y: 0 });
			entity.addComponent(VelocityComponent, { velocity: [2, 3] });
			entity.addComponent(HealthComponent);

			// Include Vec3 testing
			const entity2 = world.createEntity();
			entity2.addComponent(VectorComponent, { position: [1.0, 1.0, 1.0] });
			entity2.addComponent(VelocityComponent, { velocity: [1.0, 1.0] });

			// Initial state
			expect(entity.getValue(PositionComponent, 'x')).toBe(0);
			expect(entity.getValue(PositionComponent, 'y')).toBe(0);
			expect(entity.getValue(HealthComponent, 'value')).toBe(100);

			const positionVec3 = entity2.getVectorView(VectorComponent, 'position');
			expect(positionVec3[0]).toBe(1.0);
			expect(positionVec3[1]).toBe(1.0);
			expect(positionVec3[2]).toBe(1.0);

			// First update
			world.update(1, 1); // delta = 1
			expect(entity.getValue(PositionComponent, 'x')).toBe(2);
			expect(entity.getValue(PositionComponent, 'y')).toBe(3);
			expect(entity.getValue(HealthComponent, 'value')).toBe(90);

			// Update Vec3 position manually
			const velocityVec2 = entity2.getVectorView(VelocityComponent, 'velocity');
			positionVec3[0] += velocityVec2[0] * 1; // delta = 1
			positionVec3[1] += velocityVec2[1] * 1;
			// z remains the same
			expect(positionVec3[0]).toBe(2.0);
			expect(positionVec3[1]).toBe(2.0);
			expect(positionVec3[2]).toBe(1.0);

			// Second update
			world.update(1, 1); // delta = 1
			expect(entity.getValue(PositionComponent, 'x')).toBe(4);
			expect(entity.getValue(PositionComponent, 'y')).toBe(6);
			expect(entity.getValue(HealthComponent, 'value')).toBe(80);

			// Update Vec3 position again
			positionVec3[0] += velocityVec2[0] * 1;
			positionVec3[1] += velocityVec2[1] * 1;
			expect(positionVec3[0]).toBe(3.0);
			expect(positionVec3[1]).toBe(3.0);
			expect(positionVec3[2]).toBe(1.0);

			// Remove HealthComponent
			entity.removeComponent(HealthComponent);

			// Third update
			world.update(1, 1); // delta = 1
			expect(entity.getValue(PositionComponent, 'x')).toBe(6);
			expect(entity.getValue(PositionComponent, 'y')).toBe(9);
			// Health should remain the same since HealthComponent was removed
			expect(entity.getValue(HealthComponent, 'value')).toBe(80); // No further decrease

			// Update Vec3 position again
			positionVec3[0] += velocityVec2[0] * 1;
			positionVec3[1] += velocityVec2[1] * 1;
			expect(positionVec3[0]).toBe(4.0);
			expect(positionVec3[1]).toBe(4.0);
			expect(positionVec3[2]).toBe(1.0);
		});
	});
});

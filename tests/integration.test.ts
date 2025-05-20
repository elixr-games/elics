// integration.test.ts

import BitSet from '../src/BitSet';
import { Query } from '../src/Query';
import { Types } from '../src/Types';
import { World } from '../src/World';
import { createComponent } from '../src/Component';
import { createSystem } from '../src/System';
import { Entity } from '../src/Entity';

// Define components for testing
const PositionComponent = createComponent({
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const VelocityComponent = createComponent({
	velocity: { type: Types.Vec2, default: [0, 0] },
});

VelocityComponent.data.velocity;

const HealthComponent = createComponent({
	value: { type: Types.Int16, default: 100 },
});

const VectorComponent = createComponent({
	position: { type: Types.Vec3, default: [0, 0, 0] },
});

const NameComponent = createComponent({
	name: { type: Types.String, default: '' },
});

const CustomDataComponent = createComponent({
	data: { type: Types.Object, default: null },
});

const BoolComponent = createComponent({
	flag: { type: Types.Boolean, default: false },
});

const ReferenceComponent = createComponent({
	target: { type: Types.Entity, default: null as unknown as Entity },
});

const SimpleComponent = createComponent({
	value: { type: Types.Int8, default: 0 },
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

// Jest tests
describe('EliCS Integration Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);
		world.registerComponent(VectorComponent);
		world.registerComponent(NameComponent);
		world.registerComponent(CustomDataComponent);
		world.registerComponent(ReferenceComponent);

		world.globals['gravity'] = 9.81;
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

		test('Getting component by typeId', () => {
			expect(
				world.componentManager.getComponentByTypeId(PositionComponent.typeId),
			).toBe(PositionComponent);
		});

		test('Getting component list', () => {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			entity.addComponent(VelocityComponent);

			const components = entity.getComponents();
			expect(components).toContain(PositionComponent);
			expect(components).toContain(VelocityComponent);
		});

		test('Getting component value with invalid key', () => {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			expect(
				entity.getValue(PositionComponent, 'invalidKey' as any),
			).toBeUndefined();
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

		test('Modifying destroyed entity throws error', () => {
			const entity = world.createEntity();
			entity.destroy();

			expect(() => entity.addComponent(PositionComponent)).toThrow();
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
			entity.addComponent(PositionComponent);

			// values should be default
			expect(entity.getValue(PositionComponent, 'x')).toBe(0);
			expect(entity.getValue(PositionComponent, 'y')).toBe(0);

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

		test('getValue handles boolean types', () => {
			world.registerComponent(BoolComponent);
			const entity = world.createEntity();
			entity.addComponent(BoolComponent);

			expect(entity.getValue(BoolComponent, 'flag')).toBe(false);
			entity.setValue(BoolComponent, 'flag', 1 as any);
			expect(entity.getValue(BoolComponent, 'flag')).toBe(true);
			(BoolComponent.data as any).flag = undefined;
			expect(entity.getValue(BoolComponent, 'flag')).toBe(false);
		});

		test('Vec3 component data access', () => {
			const entity = world.createEntity();
			entity.addComponent(VectorComponent, { position: [1.0, 2.0, 3.0] });

			const position = entity.getVectorView(VectorComponent, 'position');
			const secondView = entity.getVectorView(VectorComponent, 'position');
			expect(secondView).toBe(position);

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

		test('Entity reference component data access', () => {
			const e1 = world.createEntity();
			const e2 = world.createEntity();
			e1.addComponent(ReferenceComponent, { target: e2 });

			expect(e1.getValue(ReferenceComponent, 'target')).toBe(e2);

			const e3 = world.createEntity();
			e1.setValue(ReferenceComponent, 'target', e3);

			expect(e1.getValue(ReferenceComponent, 'target')).toBe(e3);
			expect(ReferenceComponent.data.target[e1.index]).toBe(e3.index);
		});

		test('Entity reference default value', () => {
			const e = world.createEntity();
			e.addComponent(ReferenceComponent);
			expect(e.getValue(ReferenceComponent, 'target')).toBeUndefined();
			expect(ReferenceComponent.data.target[e.index]).toBe(-1);
		});

		test('onAttach and onDetach hooks', () => {
			// Create a component class that overrides onAttach and onDetach
			const HookComponent = createComponent(
				{
					onAttachCalled: { type: Types.Boolean, default: false },
					onDetachCalled: { type: Types.Boolean, default: false },
				},
				(data, index) => {
					data.onAttachCalled[index] = 1;
				},
				(data, index) => {
					data.onDetachCalled[index] = 1;
				},
			);

			world.registerComponent(HookComponent);

			const entity = world.createEntity();

			// Add the component
			entity.addComponent(HookComponent);
			expect(HookComponent.data.onAttachCalled[entity.index]).toBeTruthy();
			expect(HookComponent.data.onDetachCalled[entity.index]).toBeFalsy();

			// Remove the component
			entity.removeComponent(HookComponent);
			expect(HookComponent.data.onDetachCalled[entity.index]).toBeTruthy();

			// reset the hook data
			HookComponent.data.onDetachCalled[entity.index] = 0;
			entity.addComponent(HookComponent);
			entity.destroy();

			// onDetach should have been called due to entity destruction
			expect(HookComponent.data.onDetachCalled[entity.index]).toBeTruthy();
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

			expect(query.entities).toContain(entity1);
			expect(query.entities).not.toContain(entity2);
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

			expect(query.entities).toContain(entity1);
			expect(query.entities).not.toContain(entity2);
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

			expect(query.entities).toContain(entity2);
			expect(query.entities).not.toContain(entity1);
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

			expect(query1.entities).toContain(entity1);
			expect(query1.entities).not.toContain(entity2);

			expect(query2.entities).toContain(entity2);
			expect(query2.entities).not.toContain(entity1);
		});

		test('Removing components affects query results', () => {
			const queryConfig = {
				required: [PositionComponent, VelocityComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			entity.addComponent(VelocityComponent);

			expect(query.entities).toContain(entity);

			// Remove a component
			entity.removeComponent(VelocityComponent);

			expect(query.entities).not.toContain(entity);
		});

		test('Entity removal from all queries when last component removed', () => {
			world.registerComponent(SimpleComponent);
			const query = world.queryManager.registerQuery({
				required: [SimpleComponent],
			});
			const entity = world.createEntity();
			entity.addComponent(SimpleComponent);
			expect(query.entities).toContain(entity);
			entity.removeComponent(SimpleComponent);
			expect(query.entities).not.toContain(entity);
		});

		test('Entity destroy cleans up query results', () => {
			world.registerComponent(SimpleComponent);
			const query = world.queryManager.registerQuery({
				required: [SimpleComponent],
			});
			const entity = world.createEntity();
			entity.addComponent(SimpleComponent);
			expect(query.entities).toContain(entity);
			entity.destroy();
			expect(query.entities).not.toContain(entity);
		});

		test('Query subscribers run as expected', () => {
			const queryConfig = {
				required: [PositionComponent, VelocityComponent],
			};
			const query = world.queryManager.registerQuery(queryConfig);
			const qualifyCallback = jest.fn();
			const unsubQualify = query.subscribe('qualify', qualifyCallback);
			const disqualifyCallback = jest.fn();
			query.subscribe('disqualify', disqualifyCallback);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			entity.addComponent(VelocityComponent);
			expect(qualifyCallback).toHaveBeenCalledTimes(1);

			// Remove a component which disqualifies entity from query
			entity.removeComponent(VelocityComponent);
			expect(disqualifyCallback).toHaveBeenCalledTimes(1);

			// unsubscribe from qualify, callback no longer called when entity qualifies
			unsubQualify();
			entity.addComponent(VelocityComponent);
			expect(qualifyCallback).toHaveBeenCalledTimes(1);
		});

		test('Deferred entity updates', () => {
			const world = new World({
				checksOn: true,
				deferredEntityUpdates: true,
			});

			world.registerComponent(PositionComponent);
			world.registerComponent(VelocityComponent);

			const queryConfig = {
				required: [PositionComponent, VelocityComponent],
			};

			const query = world.queryManager.registerQuery(queryConfig);

			const entity = world.createEntity();
			entity.addComponent(PositionComponent);
			entity.addComponent(VelocityComponent);

			// query should not contain the entity before deferred update
			expect(query.entities).not.toContain(entity);

			world.queryManager.deferredUpdate();

			// query should contain the entity after deferred update
			expect(query.entities).toContain(entity);
		});

		test('Registering the same query multiple times', () => {
			const queryConfig = {
				required: [PositionComponent],
			};

			world.registerQuery(queryConfig);
			const query1 = world.queryManager.registerQuery(queryConfig);
			const query2 = world.queryManager.registerQuery(queryConfig);

			expect(query1).toBe(query2);
		});

		test('Registering query with unregistered component throws error', () => {
			const UnregisteredComponent = createComponent({
				value: { type: Types.Int16, default: 0 },
			});

			const queryConfig = {
				required: [UnregisteredComponent],
			};

			expect(() => {
				world.queryManager.registerQuery(queryConfig);
			}).toThrow();
		});

		test('Query results from unregistered query', () => {
			const world = new World({ checksOn: false });
			world.registerComponent(PositionComponent);
			const entity = world.createEntity();
			entity.addComponent(PositionComponent);

			expect(
				new Query(PositionComponent.bitmask!, new BitSet(), '').entities,
			).toEqual(new Set());
		});

		test('Newly registered query finds existing entities', () => {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent);

			const queryConfig = {
				required: [PositionComponent],
			};

			const query = world.queryManager.registerQuery(queryConfig);
			expect(query.entities).toContain(entity);
		});
	});

	// System Tests
	describe('System Tests', () => {
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

	// Overall Tests
	describe('Overall ECS functionality in production mode', () => {
		test('Integration test with multiple systems and components', () => {
			world = new World({
				checksOn: false,
			});
			world.registerComponent(PositionComponent);
			world.registerComponent(VelocityComponent);
			world.registerComponent(HealthComponent);
			world.registerComponent(VectorComponent);

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

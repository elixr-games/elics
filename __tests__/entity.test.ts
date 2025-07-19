import { Types } from '../src/types';
import { World } from '../src/world';
import { createComponent } from '../src/component';

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
	target: { type: Types.Entity, default: null as any },
});

// Define enum test components
enum Season {
	Spring = 1,
	Summer = 2,
	Fall = 3,
	Winter = 4,
}

enum LargeEnum {
	Value1 = 1,
	Value2 = 100,
	Value3 = 200,
	Value4 = 300,
}

enum NegativeEnum {
	NegLarge = -200,
	NegSmall = -50,
	Zero = 0,
	PosSmall = 50,
	PosLarge = 100,
}

const SeasonComponent = createComponent({
	season: { type: Types.Enum, enum: Season, default: Season.Spring },
});

const LargeEnumComponent = createComponent({
	value: { type: Types.Enum, enum: LargeEnum, default: LargeEnum.Value1 },
});

const NegativeEnumComponent = createComponent({
	value: { type: Types.Enum, enum: NegativeEnum, default: NegativeEnum.Zero },
});

// Define range-constrained components for testing
const RangedHealthComponent = createComponent({
	current: { type: Types.Float32, default: 100, min: 0, max: 100 },
	maximum: { type: Types.Float32, default: 100, min: 1 },
});

const TemperatureComponent = createComponent({
	celsius: { type: Types.Int16, default: 20, min: -273, max: 1000 },
});

const ScoreComponent = createComponent({
	points: { type: Types.Int8, default: 0, max: 127 },
});

const PrecisionComponent = createComponent({
	value: { type: Types.Float64, default: 0.0, min: -1.0, max: 1.0 },
});

describe('Entity Tests', () => {
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
		world.registerComponent(BoolComponent);
		world.registerComponent(SeasonComponent);
		world.registerComponent(LargeEnumComponent);
		world.registerComponent(NegativeEnumComponent);
		world.registerComponent(RangedHealthComponent);
		world.registerComponent(TemperatureComponent);
		world.registerComponent(ScoreComponent);
		world.registerComponent(PrecisionComponent);
	});

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

	test('Modifying destroyed entity logs warning and no-ops', () => {
		const entity = world.createEntity();
		entity.destroy();

		const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();

		entity.addComponent(PositionComponent);
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Entity 0 is destroyed, cannot add component'),
		);

		entity.removeComponent(PositionComponent);
		expect(consoleSpy).toHaveBeenCalledWith(
			expect.stringContaining('Entity 0 is destroyed, cannot remove component'),
		);

		consoleSpy.mockRestore();
	});

	test('Entity index lookup updates on destroy', () => {
		const entity = world.createEntity();
		const index = entity.index;
		entity.destroy();

		const newEntity = world.createEntity();
		expect(newEntity.index).toBe(index);
		expect(world.entityManager.getEntityByIndex(index)).toBe(newEntity);
	});

	test('getValue handles boolean types', () => {
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

	test('entity references work beyond Int16 range', () => {
		const world = new World({ entityCapacity: 33000 });
		const RefComp = createComponent({
			ref: { type: Types.Entity, default: null as any },
		});
		world.registerComponent(RefComp);

		// create a bunch of entities to exceed 32767 index
		let last: any = null;
		for (let i = 0; i < 33000; i++) {
			last = world.createEntity();
		}

		last.addComponent(RefComp, { ref: last });
		expect(last.getValue(RefComp, 'ref')).toBe(last);
	});

	describe('Enum component tests', () => {
		test('Enum component with default value', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			expect(entity.getValue(SeasonComponent, 'season')).toBe(Season.Spring);
		});

		test('Enum component with initial value', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent, { season: Season.Summer });

			expect(entity.getValue(SeasonComponent, 'season')).toBe(Season.Summer);
		});

		test('Setting and getting enum values', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			entity.setValue(SeasonComponent, 'season', Season.Winter);
			expect(entity.getValue(SeasonComponent, 'season')).toBe(Season.Winter);

			entity.setValue(SeasonComponent, 'season', Season.Fall);
			expect(entity.getValue(SeasonComponent, 'season')).toBe(Season.Fall);
		});

		test('Enum validation with invalid value throws error', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			// Valid values should work
			expect(() =>
				entity.setValue(SeasonComponent, 'season', Season.Summer),
			).not.toThrow();

			// Invalid values should throw
			expect(() => entity.setValue(SeasonComponent, 'season', 5)).toThrow(
				'Invalid enum value',
			);
			expect(() => entity.setValue(SeasonComponent, 'season', 0)).toThrow(
				'Invalid enum value',
			);
			expect(() => entity.setValue(SeasonComponent, 'season', -1)).toThrow(
				'Invalid enum value',
			);
		});

		test('Enum validation with checks off', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			// Turn off checks
			const originalWorld = new World({ checksOn: false });
			originalWorld.registerComponent(SeasonComponent);
			const entityNoChecks = originalWorld.createEntity();
			entityNoChecks.addComponent(SeasonComponent);

			// Invalid values should not throw with checks off
			// Note: Using 99 instead of 999 to avoid Int8Array overflow
			expect(() =>
				entityNoChecks.setValue(SeasonComponent, 'season', 99),
			).not.toThrow();
			expect(entityNoChecks.getValue(SeasonComponent, 'season')).toBe(99);
		});

		test('Large enum values use Int16Array', () => {
			const entity = world.createEntity();
			entity.addComponent(LargeEnumComponent);

			// Check that it uses Int16Array for large values
			const data = LargeEnumComponent.data.value;
			expect(data instanceof Int16Array).toBe(true);

			// Test setting and getting large values
			entity.setValue(LargeEnumComponent, 'value', LargeEnum.Value4);
			expect(entity.getValue(LargeEnumComponent, 'value')).toBe(
				LargeEnum.Value4,
			);
		});

		test('Small enum values use Int8Array', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			// Check that it uses Int8Array for small values
			const data = SeasonComponent.data.season;
			expect(data instanceof Int8Array).toBe(true);
		});

		test('Negative enum values work correctly', () => {
			const entity = world.createEntity();
			entity.addComponent(NegativeEnumComponent);

			// Check that it uses Int16Array for values outside Int8 range
			const data = NegativeEnumComponent.data.value;
			expect(data instanceof Int16Array).toBe(true);

			// Test negative values
			entity.setValue(NegativeEnumComponent, 'value', NegativeEnum.NegLarge);
			expect(entity.getValue(NegativeEnumComponent, 'value')).toBe(
				NegativeEnum.NegLarge,
			);

			entity.setValue(NegativeEnumComponent, 'value', NegativeEnum.NegSmall);
			expect(entity.getValue(NegativeEnumComponent, 'value')).toBe(
				NegativeEnum.NegSmall,
			);
		});

		test('Multiple enum fields in same component', () => {
			enum Priority {
				Low = 1,
				Medium = 2,
				High = 3,
			}

			enum Status {
				Pending = 10,
				InProgress = 20,
				Completed = 30,
			}

			const TaskComponent = createComponent({
				priority: { type: Types.Enum, enum: Priority, default: Priority.Low },
				status: { type: Types.Enum, enum: Status, default: Status.Pending },
			});

			world.registerComponent(TaskComponent);
			const entity = world.createEntity();
			entity.addComponent(TaskComponent, {
				priority: Priority.High,
				status: Status.InProgress,
			});

			expect(entity.getValue(TaskComponent, 'priority')).toBe(Priority.High);
			expect(entity.getValue(TaskComponent, 'status')).toBe(Status.InProgress);

			entity.setValue(TaskComponent, 'priority', Priority.Medium);
			entity.setValue(TaskComponent, 'status', Status.Completed);

			expect(entity.getValue(TaskComponent, 'priority')).toBe(Priority.Medium);
			expect(entity.getValue(TaskComponent, 'status')).toBe(Status.Completed);
		});

		test('Enum getValue returns number type', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			const value = entity.getValue(SeasonComponent, 'season');
			expect(typeof value).toBe('number');
			expect(value).toBe(1); // Season.Spring = 1
		});

		test('Invalid enum value in initial data throws error', () => {
			const entity = world.createEntity();

			// Invalid initial value should throw
			expect(() =>
				entity.addComponent(SeasonComponent, { season: 99 }),
			).toThrow('Invalid enum value');
		});

		test('Invalid enum default value throws error', () => {
			// This test ensures that invalid default values would be caught
			// We can't easily test this without creating a component with an invalid default,
			// but the validation logic is the same as for initial values
			const InvalidDefaultComponent = createComponent({
				value: { type: Types.Enum, enum: Season, default: 99 }, // Invalid default
			});

			world.registerComponent(InvalidDefaultComponent);
			const entity = world.createEntity();

			// Should throw when trying to add component with invalid default
			expect(() => entity.addComponent(InvalidDefaultComponent)).toThrow(
				'Invalid enum value',
			);
		});

		describe('Range validation tests', () => {
			test('Range component with default values', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent);

				expect(entity.getValue(RangedHealthComponent, 'current')).toBe(100);
				expect(entity.getValue(RangedHealthComponent, 'maximum')).toBe(100);
			});

			test('Range component with valid initial values', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent, {
					current: 50,
					maximum: 150,
				});

				expect(entity.getValue(RangedHealthComponent, 'current')).toBe(50);
				expect(entity.getValue(RangedHealthComponent, 'maximum')).toBe(150);
			});

			test('Setting values within range works', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent);

				// Valid range operations
				entity.setValue(RangedHealthComponent, 'current', 75);
				expect(entity.getValue(RangedHealthComponent, 'current')).toBe(75);

				entity.setValue(RangedHealthComponent, 'current', 0); // Min boundary
				expect(entity.getValue(RangedHealthComponent, 'current')).toBe(0);

				entity.setValue(RangedHealthComponent, 'current', 100); // Max boundary
				expect(entity.getValue(RangedHealthComponent, 'current')).toBe(100);
			});

			test('Setting values below minimum throws error', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent);

				// Below minimum
				expect(() =>
					entity.setValue(RangedHealthComponent, 'current', -1),
				).toThrow('Value out of range');

				expect(() =>
					entity.setValue(RangedHealthComponent, 'maximum', 0),
				).toThrow('Value out of range');
			});

			test('Setting values above maximum throws error', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent);

				// Above maximum
				expect(() =>
					entity.setValue(RangedHealthComponent, 'current', 101),
				).toThrow('Value out of range');
			});

			test('Invalid initial values throw error', () => {
				const entity = world.createEntity();

				// Invalid initial values
				expect(() =>
					entity.addComponent(RangedHealthComponent, { current: -5 }),
				).toThrow('Value out of range');

				expect(() =>
					entity.addComponent(RangedHealthComponent, { current: 150 }),
				).toThrow('Value out of range');
			});

			test('Temperature component with negative ranges', () => {
				const entity = world.createEntity();
				entity.addComponent(TemperatureComponent);

				// Valid temperature values
				entity.setValue(TemperatureComponent, 'celsius', -100);
				expect(entity.getValue(TemperatureComponent, 'celsius')).toBe(-100);

				entity.setValue(TemperatureComponent, 'celsius', 500);
				expect(entity.getValue(TemperatureComponent, 'celsius')).toBe(500);

				// Invalid temperature values
				expect(() =>
					entity.setValue(TemperatureComponent, 'celsius', -274),
				).toThrow('Value out of range');

				expect(() =>
					entity.setValue(TemperatureComponent, 'celsius', 1001),
				).toThrow('Value out of range');
			});

			test('Score component with max-only constraint', () => {
				const entity = world.createEntity();
				entity.addComponent(ScoreComponent);

				// Valid scores (no minimum constraint)
				entity.setValue(ScoreComponent, 'points', -100);
				expect(entity.getValue(ScoreComponent, 'points')).toBe(-100);

				entity.setValue(ScoreComponent, 'points', 127);
				expect(entity.getValue(ScoreComponent, 'points')).toBe(127);

				// Invalid score (above maximum)
				expect(() => entity.setValue(ScoreComponent, 'points', 128)).toThrow(
					'Value out of range',
				);
			});

			test('Precision component with float64 ranges', () => {
				const entity = world.createEntity();
				entity.addComponent(PrecisionComponent);

				// Valid precision values
				entity.setValue(PrecisionComponent, 'value', 0.5);
				expect(entity.getValue(PrecisionComponent, 'value')).toBe(0.5);

				entity.setValue(PrecisionComponent, 'value', -0.999);
				expect(entity.getValue(PrecisionComponent, 'value')).toBe(-0.999);

				// Invalid precision values
				expect(() => entity.setValue(PrecisionComponent, 'value', 1.1)).toThrow(
					'Value out of range',
				);

				expect(() =>
					entity.setValue(PrecisionComponent, 'value', -1.1),
				).toThrow('Value out of range');
			});

			test('Range validation with checks off', () => {
				const entity = world.createEntity();
				entity.addComponent(RangedHealthComponent);

				// Turn off checks
				const noChecksWorld = new World({ checksOn: false });
				noChecksWorld.registerComponent(RangedHealthComponent);
				const entityNoChecks = noChecksWorld.createEntity();
				entityNoChecks.addComponent(RangedHealthComponent);

				// Invalid values should not throw with checks off
				expect(() =>
					entityNoChecks.setValue(RangedHealthComponent, 'current', -50),
				).not.toThrow();
				expect(entityNoChecks.getValue(RangedHealthComponent, 'current')).toBe(
					-50,
				);

				expect(() =>
					entityNoChecks.setValue(RangedHealthComponent, 'current', 200),
				).not.toThrow();
				expect(entityNoChecks.getValue(RangedHealthComponent, 'current')).toBe(
					200,
				);
			});

			test('Components without range constraints work normally', () => {
				const entity = world.createEntity();
				entity.addComponent(PositionComponent);

				// Should work with any valid number (no range constraints)
				entity.setValue(PositionComponent, 'x', -1000);
				expect(entity.getValue(PositionComponent, 'x')).toBe(-1000);

				entity.setValue(PositionComponent, 'x', 1000);
				expect(entity.getValue(PositionComponent, 'x')).toBe(1000);
			});
		});
	});
});

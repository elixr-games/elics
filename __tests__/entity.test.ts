import { Types } from '../src/types';
import { World } from '../src/world';
import { createComponent } from '../src/component';

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

const VectorComponent = createComponent('Vector', {
	position: { type: Types.Vec3, default: [0, 0, 0] },
});

const NameComponent = createComponent('Name', {
	name: { type: Types.String, default: '' },
});

const CustomDataComponent = createComponent('CustomData', {
	data: { type: Types.Object, default: null },
});

// Test various Object types
const FlexibleObjectComponent = createComponent('FlexibleObject', {
	plainObject: {
		type: Types.Object,
		default: { key: 'value', nested: { deep: true } },
	},
	arrayData: { type: Types.Object, default: [1, 2, 3, 'mixed', true] },
	classInstance: { type: Types.Object, default: new Date() },
	functionData: { type: Types.Object, default: () => 'hello' },
	numberData: { type: Types.Object, default: 42 },
	stringData: { type: Types.Object, default: 'just a string' },
	booleanData: { type: Types.Object, default: true },
	complexNested: {
		type: Types.Object,
		default: {
			metadata: { version: '1.0', tags: ['test', 'object'] },
			config: { enabled: true, threshold: 0.5 },
			handlers: {
				onClick: () => console.log('clicked'),
				onHover: (data: any) => (data.highlight = true),
			},
		},
	},
});

const BoolComponent = createComponent('Bool', {
	flag: { type: Types.Boolean, default: false },
});

const ReferenceComponent = createComponent('Reference', {
	target: { type: Types.Entity, default: null },
});

// Define enum test components
const Season = {
	Spring: 'spring',
	Summer: 'summer',
	Fall: 'fall',
	Winter: 'winter',
} as const;

const LargeEnum = {
	Value1: 'value1',
	Value2: 'value2',
	Value3: 'value3',
	Value4: 'value4',
} as const;

const NegativeEnum = {
	NegLarge: 'neg_large',
	NegSmall: 'neg_small',
	Zero: 'zero',
	PosSmall: 'pos_small',
	PosLarge: 'pos_large',
} as const;

const SeasonComponent = createComponent('Season', {
	season: { type: Types.Enum, enum: Season, default: Season.Spring },
});

const LargeEnumComponent = createComponent('LargeEnum', {
	value: { type: Types.Enum, enum: LargeEnum, default: LargeEnum.Value1 },
});

const NegativeEnumComponent = createComponent('NegativeEnum', {
	value: { type: Types.Enum, enum: NegativeEnum, default: NegativeEnum.Zero },
});

// Define range-constrained components for testing
const RangedHealthComponent = createComponent('RangedHealth', {
	current: { type: Types.Float32, default: 100, min: 0, max: 100 },
	maximum: { type: Types.Float32, default: 100, min: 1 },
});

const TemperatureComponent = createComponent('Temperature', {
	celsius: { type: Types.Int16, default: 20, min: -273, max: 1000 },
});

const ScoreComponent = createComponent('Score', {
	points: { type: Types.Int8, default: 0, max: 127 },
});

const PrecisionComponent = createComponent('Precision', {
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
		expect(entity.getValue(PositionComponent, 'invalidKey' as any)).toBeNull();
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

	test('Vector types must use getVectorView for read/write', () => {
		const entity = world.createEntity();
		entity.addComponent(VelocityComponent, { velocity: [1, 2] });

		// getValue should throw for vector types
		expect(() => entity.getValue(VelocityComponent, 'velocity')).toThrow(
			'getVectorView',
		);

		// setValue should throw for vector types
		expect(() =>
			entity.setValue(VelocityComponent, 'velocity', [3, 4]),
		).toThrow('getVectorView');

		// Proper way still works
		const v = entity.getVectorView(VelocityComponent, 'velocity');
		v[0] = 9;
		v[1] = 8;
		const viewAgain = entity.getVectorView(VelocityComponent, 'velocity');
		expect(viewAgain[0]).toBe(9);
		expect(viewAgain[1]).toBe(8);
	});

	test('Color setValue throws; mutate via getVectorView; getValue throws', () => {
		const world = new World({ checksOn: false });
		const ColorComp = createComponent('ColorE', {
			c: { type: Types.Color, default: [1, 1, 1, 1] },
		});
		world.registerComponent(ColorComp);
		const e = world.createEntity();
		e.addComponent(ColorComp);
		// setValue should throw for Color
		expect(() =>
			e.setValue(ColorComp, 'c' as any, [0, 0.5, 1, 0.25] as any),
		).toThrow('getVectorView');
		// mutate through vector view
		const v = e.getVectorView(ColorComp, 'c');
		v[0] = 0;
		v[1] = 0.5;
		v[2] = 1;
		v[3] = 0.25;
		const again = e.getVectorView(ColorComp, 'c');
		expect(again[0]).toBeCloseTo(0, 5);
		expect(again[1]).toBeCloseTo(0.5, 5);
		expect(again[2]).toBeCloseTo(1, 5);
		expect(again[3]).toBeCloseTo(0.25, 5);
		// getValue should throw for Color
		expect(() => e.getValue(ColorComp, 'c' as any)).toThrow('getVectorView');
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
		expect(e.getValue(ReferenceComponent, 'target')).toBeNull();
		expect(ReferenceComponent.data.target[e.index]).toBe(-1);
	});

	test('Object type can handle various data types', () => {
		const entity = world.createEntity();
		entity.addComponent(FlexibleObjectComponent);

		// Test that defaults were set correctly
		expect(entity.getValue(FlexibleObjectComponent, 'plainObject')).toEqual({
			key: 'value',
			nested: { deep: true },
		});
		expect(entity.getValue(FlexibleObjectComponent, 'arrayData')).toEqual([
			1,
			2,
			3,
			'mixed',
			true,
		]);
		expect(
			entity.getValue(FlexibleObjectComponent, 'classInstance'),
		).toBeInstanceOf(Date);
		expect(entity.getValue(FlexibleObjectComponent, 'numberData')).toBe(42);
		expect(entity.getValue(FlexibleObjectComponent, 'stringData')).toBe(
			'just a string',
		);
		expect(entity.getValue(FlexibleObjectComponent, 'booleanData')).toBe(true);

		const complexData = entity.getValue(
			FlexibleObjectComponent,
			'complexNested',
		);
		expect(complexData).toHaveProperty('metadata.version', '1.0');
		expect(complexData).toHaveProperty('config.enabled', true);
		expect(complexData).toHaveProperty('handlers.onClick');

		// Test function execution
		const functionValue = entity.getValue(
			FlexibleObjectComponent,
			'functionData',
		) as () => string;
		expect(typeof functionValue).toBe('function');
		expect(functionValue()).toBe('hello');

		// Test setting various types
		entity.setValue(
			FlexibleObjectComponent,
			'plainObject',
			"now it's a string",
		);
		expect(entity.getValue(FlexibleObjectComponent, 'plainObject')).toBe(
			"now it's a string",
		);

		entity.setValue(FlexibleObjectComponent, 'numberData', {
			converted: 'to object',
		});
		expect(entity.getValue(FlexibleObjectComponent, 'numberData')).toEqual({
			converted: 'to object',
		});

		entity.setValue(FlexibleObjectComponent, 'stringData', [1, 2, 3]);
		expect(entity.getValue(FlexibleObjectComponent, 'stringData')).toEqual([
			1, 2, 3,
		]);

		// Test setting null
		entity.setValue(FlexibleObjectComponent, 'complexNested', null);
		expect(
			entity.getValue(FlexibleObjectComponent, 'complexNested'),
		).toBeNull();
	});

	test('entity references work beyond Int16 range', () => {
		const world = new World({ entityCapacity: 33000 });
		const RefComp = createComponent('RefComp', {
			ref: { type: Types.Entity, default: null },
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
			expect(() =>
				entity.setValue(SeasonComponent, 'season', 'invalid'),
			).toThrow('Invalid enum value');
			expect(() =>
				entity.setValue(SeasonComponent, 'season', 'unknown'),
			).toThrow('Invalid enum value');
			expect(() => entity.setValue(SeasonComponent, 'season', 'bad')).toThrow(
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
			expect(() =>
				entityNoChecks.setValue(SeasonComponent, 'season', 'invalid_season'),
			).not.toThrow();
			expect(entityNoChecks.getValue(SeasonComponent, 'season')).toBe(
				'invalid_season',
			);
		});

		test('Enum values use Array for strings', () => {
			const entity = world.createEntity();
			entity.addComponent(LargeEnumComponent);

			// Check that it uses Array for string values
			const data = LargeEnumComponent.data.value;
			expect(data instanceof Array).toBe(true);

			// Test setting and getting values
			entity.setValue(LargeEnumComponent, 'value', LargeEnum.Value4);
			expect(entity.getValue(LargeEnumComponent, 'value')).toBe(
				LargeEnum.Value4,
			);
		});

		test('All enum values use Array for strings', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			// Check that it uses Array for string values
			const data = SeasonComponent.data.season;
			expect(data instanceof Array).toBe(true);
		});

		test('String enum values work correctly', () => {
			const entity = world.createEntity();
			entity.addComponent(NegativeEnumComponent);

			// Check that it uses Array for string values
			const data = NegativeEnumComponent.data.value;
			expect(data instanceof Array).toBe(true);

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
			const Priority = {
				Low: 'low',
				Medium: 'medium',
				High: 'high',
			} as const;

			const Status = {
				Pending: 'pending',
				InProgress: 'in_progress',
				Completed: 'completed',
			} as const;

			const TaskComponent = createComponent('Task', {
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

		test('Enum getValue returns string type', () => {
			const entity = world.createEntity();
			entity.addComponent(SeasonComponent);

			const value = entity.getValue(SeasonComponent, 'season');
			expect(typeof value).toBe('string');
			expect(value).toBe('spring'); // Season.Spring = 'spring'
		});

		test('Invalid enum value in initial data throws error', () => {
			const entity = world.createEntity();

			// Invalid initial value should throw
			expect(() =>
				entity.addComponent(SeasonComponent, { season: 'invalid' }),
			).toThrow('Invalid enum value');
		});

		test('Invalid enum default value throws error', () => {
			// This test ensures that invalid default values would be caught
			// We can't easily test this without creating a component with an invalid default,
			// but the validation logic is the same as for initial values
			const InvalidDefaultComponent = createComponent('InvalidDefault', {
				value: { type: Types.Enum, enum: Season, default: 'invalid' }, // Invalid default
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

	test('EntityManager getEntityByIndex with invalid index returns null', () => {
		// Test the uncovered line in entity-manager.ts:45
		expect(world.entityManager.getEntityByIndex(-1)).toBeNull();

		// Test undefined case (line 47) - index that doesn't exist yet
		expect(world.entityManager.getEntityByIndex(9999)).toBeNull();
	});

	test('ComponentManager getComponentByTypeId with invalid typeId returns null', () => {
		// Test the uncovered line in component-manager.ts:43
		expect(world.componentManager.getComponentByTypeId(999)).toBeNull();
	});

	test('Double destruction is safe', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.destroy();
		expect(entity.active).toBe(false);

		// Second destroy should not throw
		expect(() => entity.destroy()).not.toThrow();
		expect(entity.active).toBe(false);
	});

	test('Vector view cache is cleared when component is removed', () => {
		const entity = world.createEntity();
		entity.addComponent(VectorComponent, { position: [1, 2, 3] });
		const view1 = entity.getVectorView(VectorComponent, 'position');
		expect(view1[0]).toBe(1);

		entity.removeComponent(VectorComponent);
		entity.addComponent(VectorComponent, { position: [4, 5, 6] });
		const view2 = entity.getVectorView(VectorComponent, 'position');

		// Views should be different instances after re-add
		expect(view1).not.toBe(view2);
		expect(view2[0]).toBe(4);
	});

	test('Entity referencing itself', () => {
		const entity = world.createEntity();
		entity.addComponent(ReferenceComponent, { target: entity });

		expect(entity.getValue(ReferenceComponent, 'target')).toBe(entity);
	});

	test('Entity setValue with null entity value', () => {
		// Test the uncovered branch in entity.ts:148 (null case)
		const entity = world.createEntity();
		entity.addComponent(ReferenceComponent);

		// Set to null to test the null branch
		entity.setValue(ReferenceComponent, 'target', null);
		expect(entity.getValue(ReferenceComponent, 'target')).toBeNull();
		expect(ReferenceComponent.data.target[entity.index]).toBe(-1);
	});
});

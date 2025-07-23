import { Types } from '../src/types';
import { World } from '../src/world';
import { createComponent, ComponentRegistry } from '../src/component';

// Define components for testing
const PositionComponent = createComponent('Position', {
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const HealthComponent = createComponent('Health', {
	value: { type: Types.Int16, default: 100 },
});

describe('Component Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
		world.registerComponent(PositionComponent);
		world.registerComponent(HealthComponent);
	});

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

	test('Query subscribe callbacks can track component lifecycle', () => {
		// Create a test component
		const TrackingComponent = createComponent('Tracking', {
			tracked: { type: Types.Boolean, default: false },
		});

		world.registerComponent(TrackingComponent);

		// Create a query for the component
		const query = world.queryManager.registerQuery({
			required: [TrackingComponent],
		});

		const qualifyCallback = jest.fn();
		const disqualifyCallback = jest.fn();

		query.subscribe('qualify', qualifyCallback);
		query.subscribe('disqualify', disqualifyCallback);

		const entity = world.createEntity();

		// Add the component - should trigger qualify
		entity.addComponent(TrackingComponent);
		expect(qualifyCallback).toHaveBeenCalledWith(entity);
		expect(qualifyCallback).toHaveBeenCalledTimes(1);
		expect(disqualifyCallback).not.toHaveBeenCalled();

		// Remove the component - should trigger disqualify
		entity.removeComponent(TrackingComponent);
		expect(disqualifyCallback).toHaveBeenCalledWith(entity);
		expect(disqualifyCallback).toHaveBeenCalledTimes(1);
		expect(qualifyCallback).toHaveBeenCalledTimes(1);

		// Reset and test entity destruction
		qualifyCallback.mockClear();
		disqualifyCallback.mockClear();
		entity.addComponent(TrackingComponent);

		// Destroy entity - should trigger disqualify
		entity.destroy();
		expect(disqualifyCallback).toHaveBeenCalledWith(entity);
		expect(disqualifyCallback).toHaveBeenCalledTimes(1);
	});

	test('Enum component initialization', () => {
		enum Direction {
			North = 1,
			East = 2,
			South = 3,
			West = 4,
		}

		const DirectionComponent = createComponent('Direction', {
			facing: { type: Types.Enum, enum: Direction, default: Direction.North },
		});

		world.registerComponent(DirectionComponent);

		// Check that the component was initialized with the correct array type
		expect(DirectionComponent.data.facing).toBeDefined();
		expect(DirectionComponent.data.facing instanceof Int8Array).toBe(true);

		// Create entity and check default
		const entity = world.createEntity();
		entity.addComponent(DirectionComponent);
		expect(entity.getValue(DirectionComponent, 'facing')).toBe(Direction.North);
	});

	test('Enum component with values requiring Int16Array', () => {
		enum BigNumbers {
			Small = 100,
			Medium = 500,
			Large = 1000,
		}

		const BigNumberComponent = createComponent('BigNumber', {
			value: { type: Types.Enum, enum: BigNumbers, default: BigNumbers.Small },
		});

		world.registerComponent(BigNumberComponent);

		// Check that it uses Int16Array for large values
		expect(BigNumberComponent.data.value instanceof Int16Array).toBe(true);
	});

	test('Enum component without enum property throws error', () => {
		// Create a component with invalid enum schema (missing enum property)
		const InvalidEnumComponent = {
			schema: {
				value: { type: Types.Enum, default: 1 }, // Missing enum property
			},
			data: {} as any,
			bitmask: null,
			typeId: -1,
		} as any; // Type assertion needed for intentionally invalid component

		// Should throw when trying to register component with missing enum property
		expect(() => world.registerComponent(InvalidEnumComponent)).toThrow(
			'Invalid default value',
		);
	});

	test('Registering the same component multiple times is idempotent', () => {
		const TestComponent = createComponent('Test', {
			value: { type: Types.Int16, default: 42 },
		});

		// Register component first time
		world.registerComponent(TestComponent);
		expect(world.hasComponent(TestComponent)).toBe(true);
		const firstTypeId = TestComponent.typeId;

		// Register the same component again - should be no-op
		world.registerComponent(TestComponent);
		expect(world.hasComponent(TestComponent)).toBe(true);
		expect(TestComponent.typeId).toBe(firstTypeId); // TypeId should not change
	});

	test('hasComponent returns false for unregistered components', () => {
		const UnregisteredComponent = createComponent('Unregistered1', {
			value: { type: Types.Boolean, default: false },
		});

		expect(world.hasComponent(UnregisteredComponent)).toBe(false);
	});

	test('Using unregistered component auto-registers it', () => {
		const UnregisteredComponent = createComponent('Unregistered2', {
			value: { type: Types.Boolean, default: true },
		});

		// Component should not be registered initially
		expect(world.hasComponent(UnregisteredComponent)).toBe(false);

		// Adding component to entity should auto-register it
		const entity = world.createEntity();
		entity.addComponent(UnregisteredComponent);

		expect(world.hasComponent(UnregisteredComponent)).toBe(true);
		expect(entity.hasComponent(UnregisteredComponent)).toBe(true);
		expect(entity.getValue(UnregisteredComponent, 'value')).toBe(true);
	});

	test('Component metadata is stored correctly', () => {
		const ComponentWithDescription = createComponent(
			'TestWithDesc',
			{
				value: { type: Types.Int16, default: 42 },
			},
			'A test component with description',
		);

		const ComponentWithoutDescription = createComponent('TestWithoutDesc', {
			value: { type: Types.Int16, default: 24 },
		});

		// Verify id is stored
		expect(ComponentWithDescription.id).toBe('TestWithDesc');
		expect(ComponentWithoutDescription.id).toBe('TestWithoutDesc');

		// Verify description is stored correctly
		expect(ComponentWithDescription.description).toBe(
			'A test component with description',
		);
		expect(ComponentWithoutDescription.description).toBeUndefined();

		// Verify schema is still accessible
		expect(ComponentWithDescription.schema.value.type).toBe(Types.Int16);
		expect(ComponentWithDescription.schema.value.default).toBe(42);
	});

	test('Component metadata does not affect functionality', () => {
		const MetadataComponent = createComponent(
			'MetadataTest',
			{
				x: { type: Types.Float32, default: 10 },
				y: { type: Types.Float32, default: 20 },
			},
			'Component with metadata for testing',
		);

		world.registerComponent(MetadataComponent);
		const entity = world.createEntity();

		// Component should work normally despite having metadata
		entity.addComponent(MetadataComponent);
		expect(entity.hasComponent(MetadataComponent)).toBe(true);
		expect(entity.getValue(MetadataComponent, 'x')).toBe(10);
		expect(entity.getValue(MetadataComponent, 'y')).toBe(20);

		// Set values
		entity.setValue(MetadataComponent, 'x', 100);
		entity.setValue(MetadataComponent, 'y', 200);
		expect(entity.getValue(MetadataComponent, 'x')).toBe(100);
		expect(entity.getValue(MetadataComponent, 'y')).toBe(200);

		// Remove component
		entity.removeComponent(MetadataComponent);
		expect(entity.hasComponent(MetadataComponent)).toBe(false);
	});

	describe('ComponentRegistry', () => {
		beforeEach(() => {
			// Clear registry before each test to avoid interference
			ComponentRegistry.clear();
		});

		test('Components are automatically recorded when created', () => {
			const TestComponent = createComponent('AutoRecordTest', {
				value: { type: Types.Int16, default: 42 },
			});

			expect(ComponentRegistry.has('AutoRecordTest')).toBe(true);
			expect(ComponentRegistry.getById('AutoRecordTest')).toBe(TestComponent);
		});

		test('Can retrieve component by ID', () => {
			const Component1 = createComponent('Component1', {
				x: { type: Types.Float32, default: 0 },
			});
			const Component2 = createComponent('Component2', {
				y: { type: Types.Float32, default: 0 },
			});

			expect(ComponentRegistry.getById('Component1')).toBe(Component1);
			expect(ComponentRegistry.getById('Component2')).toBe(Component2);
			expect(ComponentRegistry.getById('NonExistent')).toBeUndefined();
		});

		test('Can check if component exists', () => {
			createComponent('ExistsTest', {
				value: { type: Types.Boolean, default: true },
			});

			expect(ComponentRegistry.has('ExistsTest')).toBe(true);
			expect(ComponentRegistry.has('DoesNotExist')).toBe(false);
		});

		test('Can get all recorded components', () => {
			const Component1 = createComponent('GetAll1', {
				a: { type: Types.Int8, default: 1 },
			});
			const Component2 = createComponent('GetAll2', {
				b: { type: Types.Int8, default: 2 },
			});

			const allComponents = ComponentRegistry.getAllComponents();
			expect(allComponents).toHaveLength(2);
			expect(allComponents).toContain(Component1);
			expect(allComponents).toContain(Component2);
		});

		test('Throws error when creating component with duplicate ID', () => {
			createComponent('DuplicateTest', {
				value1: { type: Types.Int16, default: 1 },
			});

			// Creating another component with same ID should throw
			expect(() => {
				createComponent('DuplicateTest', {
					value2: { type: Types.Int16, default: 2 },
				});
			}).toThrow(
				"Component with id 'DuplicateTest' already exists. Each component must have a unique identifier.",
			);

			// First component should still be recorded
			const recorded = ComponentRegistry.getById('DuplicateTest');
			expect(recorded?.schema).toHaveProperty('value1');
			expect(recorded?.schema).not.toHaveProperty('value2');
		});

		test('Clear removes all recorded components', () => {
			createComponent('ClearTest1', { a: { type: Types.Int8, default: 1 } });
			createComponent('ClearTest2', { b: { type: Types.Int8, default: 2 } });

			expect(ComponentRegistry.getAllComponents()).toHaveLength(2);

			ComponentRegistry.clear();

			expect(ComponentRegistry.getAllComponents()).toHaveLength(0);
			expect(ComponentRegistry.has('ClearTest1')).toBe(false);
			expect(ComponentRegistry.has('ClearTest2')).toBe(false);
		});

		test('Registry works with component metadata', () => {
			const ComponentWithMeta = createComponent(
				'MetaRegistryTest',
				{
					value: { type: Types.String, default: 'test' },
				},
				'Component with metadata for registry testing',
			);

			const retrieved = ComponentRegistry.getById('MetaRegistryTest');
			expect(retrieved).toBe(ComponentWithMeta);
			expect(retrieved?.id).toBe('MetaRegistryTest');
			expect(retrieved?.description).toBe(
				'Component with metadata for registry testing',
			);
		});
	});
});

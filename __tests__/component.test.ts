import { Types } from '../src/types';
import { World } from '../src/world';
import { createComponent } from '../src/component';

// Define components for testing
const PositionComponent = createComponent({
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const HealthComponent = createComponent({
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
		const TrackingComponent = createComponent({
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

		const DirectionComponent = createComponent({
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

		const BigNumberComponent = createComponent({
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
		};

		// Should throw when trying to register component with missing enum property
		expect(() => world.registerComponent(InvalidEnumComponent)).toThrow(
			'Invalid default value',
		);
	});

	test('Registering the same component multiple times is idempotent', () => {
		const TestComponent = createComponent({
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
		const UnregisteredComponent = createComponent({
			value: { type: Types.Boolean, default: false },
		});

		expect(world.hasComponent(UnregisteredComponent)).toBe(false);
	});
});

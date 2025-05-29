import { World } from '../src/world';
import { createComponent } from '../src/component';
import { Types } from '../src/types';

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
});

import { World } from '../src/World';
import { createComponent } from '../src/Component';
import { Types } from '../src/Types';

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

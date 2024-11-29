import { Component } from '../src/Component';
import { ComponentManager } from '../src/ComponentManager';

// Mock component class for testing
class MockComponent extends Component {
	public testData: any;

	public reset() {
		delete this.testData;
	}
}

describe('Component and ComponentManager', () => {
	let componentManager: ComponentManager;

	beforeEach(() => {
		componentManager = new ComponentManager();
		componentManager.registerComponent(MockComponent);
	});

	test('ComponentManager should request a new component instance', () => {
		const component = componentManager.requestComponentInstance(MockComponent);
		expect(component).toBeInstanceOf(MockComponent);
	});

	test('should assign initial values to the component', () => {
		const initialData = { testData: 'initial value' };
		const component = componentManager.requestComponentInstance(
			MockComponent,
			initialData,
		) as MockComponent;

		expect(component.testData).toBe(initialData.testData);
	});

	test('ComponentManager should reuse a released component instance', () => {
		const firstInstance =
			componentManager.requestComponentInstance(MockComponent);
		componentManager.releaseComponentInstance(firstInstance);

		const secondInstance =
			componentManager.requestComponentInstance(MockComponent);
		expect(secondInstance).toBe(firstInstance); // Should be the same instance reused
	});

	test('Component reset method should be called upon release', () => {
		const component = componentManager.requestComponentInstance(MockComponent);
		componentManager.releaseComponentInstance(component);

		expect(component as MockComponent).not.toHaveProperty('testData');
	});

	test('ComponentManager should throw an error for unregistered components', () => {
		class UnregisteredComponent extends Component {}

		expect(() => {
			componentManager.requestComponentInstance(UnregisteredComponent);
		}).toThrow('Component class not registered');
	});
});

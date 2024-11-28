import { ComponentManager } from './ComponentManager.js';

export type ComponentMask = number;

export const PRIVATE = Symbol('@elics/component');

export class Component {
	static bitmask: ComponentMask | null = null;
	static defaults: { [key: string]: any } = {};

	public reset(): void {
		// noop
	}

	[PRIVATE]: {
		componentManager: ComponentManager;
		index: number;
	} = {
		componentManager: null as any,
		index: null as any,
	};

	constructor(
		componentManager: ComponentManager,
		index: number,
		initialData: { [key: string]: any } = {},
	) {
		this[PRIVATE].componentManager = componentManager;
		this[PRIVATE].index = index;

		Object.assign(
			this,
			(this.constructor as ComponentConstructor<any>).defaults,
		);
		Object.assign(this, initialData);
	}
}

export type ComponentConstructor<T extends Component> = {
	new (
		_cm: ComponentManager,
		_mi: number,
		initialData?: { [key: string]: any },
	): T;
	bitmask: number | null; // Static property
	defaults: { [key: string]: any }; // Other static properties, if needed
};

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

		Object.assign(this, (this.constructor as typeof Component).defaults);
		Object.assign(this, initialData);
	}
}

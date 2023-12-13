import { ComponentManager } from './ComponentManager';

export type ComponentMask = number;

export const PRIVATE = Symbol('@elics/component');

export class Component {
	static bitmask: ComponentMask | null = null;

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

		Object.assign(this, initialData);
	}
}

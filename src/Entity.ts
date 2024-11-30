import type { ComponentConstructor, ComponentMask } from './Component.js';

import BitSet from 'bitset';
import type { ComponentManager } from './ComponentManager.js';
import type { EntityManager } from './EntityManager.js';
import type { QueryManager } from './QueryManager.js';

const ERRORS = {
	MODIFY_DESTROYED_ENTITY: 'Cannot modify a destroyed entity',
	ACCESS_DESTROYED_ENTITY: 'Cannot access a destroyed entity',
};

export interface EntityLike {
	bitmask: ComponentMask;
	active: boolean;
	readonly index: number;

	addComponent(
		componentClass: ComponentConstructor,
		initialData?: { [key: string]: any },
	): this;

	removeComponent(componentClass: ComponentConstructor): void;

	hasComponent(componentClass: ComponentConstructor): boolean;

	destroy(): void;
}

export const PRIVATE = Symbol('@elics/entity');

export class Entity {
	public bitmask: ComponentMask = new BitSet();
	public active = true;

	constructor(
		protected entityManager: EntityManager,
		protected queryManager: QueryManager,
		protected componentManager: ComponentManager,
		public readonly index: number,
	) {}

	addComponent(
		componentClass: ComponentConstructor,
		initialData: { [key: string]: any } = {},
	): this {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);

		if (componentClass.bitmask !== null) {
			this.bitmask = this.bitmask.or(componentClass.bitmask);
			this.componentManager.attachComponentToEntity(
				this.index,
				componentClass,
				initialData,
			);
			this.queryManager.updateEntity(this);
			return this;
		} else {
			throw new Error('Component type not registered');
		}
	}

	removeComponent(componentClass: ComponentConstructor): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);

		if (componentClass.bitmask !== null) {
			this.bitmask = this.bitmask.andNot(componentClass.bitmask);
			this.queryManager.updateEntity(this);
		} else {
			throw new Error('Component not found');
		}
	}

	hasComponent(componentClass: ComponentConstructor): boolean {
		const componentBitmask = componentClass.bitmask;
		if (componentBitmask) {
			return !this.bitmask.and(componentBitmask).isEmpty();
		} else {
			throw new Error('Component type not registered');
		}
	}

	destroy(): void {
		if (!this.active) throw new Error(ERRORS.MODIFY_DESTROYED_ENTITY);
		this.entityManager.releaseEntityInstance(this);
		this.active = false;
		this.bitmask = new BitSet();
		this.queryManager.updateEntity(this);
	}
}

export type EntityConstructor = {
	new (
		_em: EntityManager,
		_qm: QueryManager,
		_cm: ComponentManager,
		_idx: number,
	): EntityLike;
};

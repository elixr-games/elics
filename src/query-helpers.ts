import type { AnyComponent } from './types.js';
import type { ValuePredicate } from './query.js';

type ValueOf<
	C extends AnyComponent,
	K extends keyof C['schema'],
> = import('./types.js').TypeValueToType<C['schema'][K]['type']>;

type KeysOfType<C extends AnyComponent, T> = {
	[K in keyof C['schema']]: ValueOf<C, K> extends T ? K : never;
}[keyof C['schema']];

type NumericKeys<C extends AnyComponent> = KeysOfType<C, number>;

export function eq<C extends AnyComponent, K extends keyof C['schema']>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'eq', value };
}

export function ne<C extends AnyComponent, K extends keyof C['schema']>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'ne', value };
}

export function lt<C extends AnyComponent, K extends NumericKeys<C>>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'lt', value };
}

export function le<C extends AnyComponent, K extends NumericKeys<C>>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'le', value };
}

export function gt<C extends AnyComponent, K extends NumericKeys<C>>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'gt', value };
}

export function ge<C extends AnyComponent, K extends NumericKeys<C>>(
	component: C,
	key: K,
	value: ValueOf<C, K>,
): ValuePredicate {
	return { component, key: key as string, op: 'ge', value };
}

export function isin<C extends AnyComponent, K extends keyof C['schema']>(
	component: C,
	key: K,
	values: ReadonlyArray<ValueOf<C, K>>,
): ValuePredicate {
	return { component, key: key as string, op: 'in', value: values as unknown };
}

export function nin<C extends AnyComponent, K extends keyof C['schema']>(
	component: C,
	key: K,
	values: ReadonlyArray<ValueOf<C, K>>,
): ValuePredicate {
	return { component, key: key as string, op: 'nin', value: values as unknown };
}

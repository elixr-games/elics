import { createWorld, trait, cacheQuery } from 'koota';
import { time, ITERATIONS } from './bench-util.js';

// Silence ecsy warnings in console
console.warn = () => {};

export function packedIteration() {
	const world = createWorld();
	const A = trait({ value: 1 });
	const B = trait({ value: 1 });
	const C = trait({ value: 1 });
	const D = trait({ value: 1 });
	const E = trait({ value: 1 });

	for (let i = 0; i < 1000; i++) world.spawn(A, B, C, D, E);

	const qA = cacheQuery(A);
	const qB = cacheQuery(B);
	const qC = cacheQuery(C);
	const qD = cacheQuery(D);
	const qE = cacheQuery(E);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.query(qA).useStores(([a], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					a.value[id] *= 2;
				}
			});
			world.query(qB).useStores(([b], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					b.value[id] *= 2;
				}
			});
			world.query(qC).useStores(([c], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					c.value[id] *= 2;
				}
			});
			world.query(qD).useStores(([d], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					d.value[id] *= 2;
				}
			});
			world.query(qE).useStores(([e], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					e.value[id] *= 2;
				}
			});
		}
		world.destroy();
	});
}

export function simpleIteration() {
	const world = createWorld();
	const A = trait({ value: 0 });
	const B = trait({ value: 0 });
	const C = trait({ value: 0 });
	const D = trait({ value: 0 });
	const E = trait({ value: 0 });

	for (let i = 0; i < 1000; i++) world.spawn(A, B);
	for (let i = 0; i < 1000; i++) world.spawn(A, B, C);
	for (let i = 0; i < 1000; i++) world.spawn(A, B, C, D);
	for (let i = 0; i < 1000; i++) world.spawn(A, B, C, E);

	const qAB = cacheQuery(A, B);
	const qCD = cacheQuery(C, D);
	const qCE = cacheQuery(C, E);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.query(qAB).useStores(([a, b], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					const t = a.value[id];
					a.value[id] = b.value[id];
					b.value[id] = t;
				}
			});
			world.query(qCD).useStores(([c, d], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					const t = c.value[id];
					c.value[id] = d.value[id];
					d.value[id] = t;
				}
			});
			world.query(qCE).useStores(([c, e], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					const t = c.value[id];
					c.value[id] = e.value[id];
					e.value[id] = t;
				}
			});
		}
		world.destroy();
	});
}

export function fragmentedIteration() {
	const world = createWorld();
	const Data = trait({ value: 0 });
	const comps = [];
	for (let i = 0; i < 26; i++) comps[i] = trait({ value: 0 });

	for (let i = 0; i < 26; i++) {
		for (let j = 0; j < 100; j++) {
			world.spawn(comps[i], Data);
		}
	}

	const qData = cacheQuery(Data);
	const qZ = cacheQuery(comps[25]);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.query(qData).useStores(([d], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					d.value[id] *= 2;
				}
			});
			world.query(qZ).useStores(([z], entities) => {
				for (let j = 0; j < entities.length; j++) {
					const id = entities[j].id();
					z.value[id] *= 2;
				}
			});
		}
		world.destroy();
	});
}

export function entityCycle() {
	const world = createWorld();
	const A = trait({ value: 0 });
	const B = trait({ value: 0 });

	for (let i = 0; i < 1000; i++) world.spawn(A);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.query(A).forEach(() => {
				world.spawn(B);
			});
			world
				.query(B)
				.slice()
				.forEach((e) => {
					e.destroy();
				});
		}
		world.destroy();
	});
}

export function addRemove() {
	const world = createWorld();
	const A = trait({ value: 0 });
	const B = trait({ value: 0 });

	for (let i = 0; i < 1000; i++) world.spawn(A);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.query(A).forEach((e) => e.add(B));
			world.query(B).forEach((e) => e.remove(B));
		}
		world.destroy();
	});
}

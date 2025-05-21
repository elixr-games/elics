import { performance } from 'node:perf_hooks';
import { createWorld, trait } from 'koota';

const ITERATIONS = 100;

function time(fn) {
	const start = performance.now();
	fn();
	return performance.now() - start;
}

export function packedIteration() {
	const world = createWorld();
	const A = trait({ value: 1 });
	const B = trait({ value: 1 });
	const C = trait({ value: 1 });
	const D = trait({ value: 1 });
	const E = trait({ value: 1 });

	for (let i = 0; i < 1000; i++) world.spawn(A, B, C, D, E);

	const qA = () => world.query(A);
	const qB = () => world.query(B);
	const qC = () => world.query(C);
	const qD = () => world.query(D);
	const qE = () => world.query(E);

	const updateA = ([a]) => {
		a.value *= 2;
	};
	const updateB = ([b]) => {
		b.value *= 2;
	};
	const updateC = ([c]) => {
		c.value *= 2;
	};
	const updateD = ([d]) => {
		d.value *= 2;
	};
	const updateE = ([e]) => {
		e.value *= 2;
	};

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			qA().updateEach(updateA, { changeDetection: 'never' });
			qB().updateEach(updateB, { changeDetection: 'never' });
			qC().updateEach(updateC, { changeDetection: 'never' });
			qD().updateEach(updateD, { changeDetection: 'never' });
			qE().updateEach(updateE, { changeDetection: 'never' });
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

	const qAB = () => world.query(A, B);
	const qCD = () => world.query(C, D);
	const qCE = () => world.query(C, E);

	const updateAB = ([a, b]) => {
		const t = a.value;
		a.value = b.value;
		b.value = t;
	};
	const updateCD = ([c, d]) => {
		const t = c.value;
		c.value = d.value;
		d.value = t;
	};
	const updateCE = ([c, e]) => {
		const t = c.value;
		c.value = e.value;
		e.value = t;
	};

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			qAB().updateEach(updateAB, { changeDetection: 'never' });
			qCD().updateEach(updateCD, { changeDetection: 'never' });
			qCE().updateEach(updateCE, { changeDetection: 'never' });
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

	const qData = () => world.query(Data);
	const qZ = () => world.query(comps[25]);
	const updateData = ([d]) => {
		d.value *= 2;
	};
	const updateZ = ([z]) => {
		z.value *= 2;
	};

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			qData().updateEach(updateData, { changeDetection: 'never' });
			qZ().updateEach(updateZ, { changeDetection: 'never' });
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

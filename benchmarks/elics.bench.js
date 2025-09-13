import {
	World as EliWorld,
	createComponent,
	createSystem,
	Types,
} from '../lib/index.js';
import { time, ITERATIONS } from './bench-util.js';

// Silence ecsy warnings in console
console.warn = () => {};

export function packedIteration() {
	const world = new EliWorld({ entityCapacity: 1000, checksOn: false });
	const A = createComponent('A', {
		value: { type: Types.Float32, default: 1 },
	});
	const B = createComponent('B', {
		value: { type: Types.Float32, default: 1 },
	});
	const C = createComponent('C', {
		value: { type: Types.Float32, default: 1 },
	});
	const D = createComponent('D', {
		value: { type: Types.Float32, default: 1 },
	});
	const E = createComponent('E', {
		value: { type: Types.Float32, default: 1 },
	});

	class PackedSystem extends createSystem({
		a: { required: [A] },
		b: { required: [B] },
		c: { required: [C] },
		d: { required: [D] },
		e: { required: [E] },
	}) {
		update() {
			for (const e of this.queries.a.entities) {
				const idx = e.index;
				A.data.value[idx] *= 2;
			}
			for (const e of this.queries.b.entities) {
				const idx = e.index;
				B.data.value[idx] *= 2;
			}
			for (const e of this.queries.c.entities) {
				const idx = e.index;
				C.data.value[idx] *= 2;
			}
			for (const e of this.queries.d.entities) {
				const idx = e.index;
				D.data.value[idx] *= 2;
			}
			for (const e of this.queries.e.entities) {
				const idx = e.index;
				E.data.value[idx] *= 2;
			}
		}
	}

	world
		.registerComponent(A)
		.registerComponent(B)
		.registerComponent(C)
		.registerComponent(D)
		.registerComponent(E)
		.registerSystem(PackedSystem);

	for (let i = 0; i < 1000; i++) {
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(D)
			.addComponent(E);
	}

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function simpleIteration() {
	const world = new EliWorld({ entityCapacity: 5000, checksOn: false });
	const A = createComponent('A', {
		value: { type: Types.Float32, default: 0 },
	});
	const B = createComponent('B', {
		value: { type: Types.Float32, default: 0 },
	});
	const C = createComponent('C', {
		value: { type: Types.Float32, default: 0 },
	});
	const D = createComponent('D', {
		value: { type: Types.Float32, default: 0 },
	});
	const E = createComponent('E', {
		value: { type: Types.Float32, default: 0 },
	});

	class SystemAB extends createSystem({ q: { required: [A, B] } }) {
		update() {
			for (const e of this.queries.q.entities) {
				const idx = e.index;
				const av = A.data.value[idx];
				const bv = B.data.value[idx];
				A.data.value[idx] = bv;
				B.data.value[idx] = av;
			}
		}
	}
	class SystemCD extends createSystem({ q: { required: [C, D] } }) {
		update() {
			for (const e of this.queries.q.entities) {
				const idx = e.index;
				const cv = C.data.value[idx];
				const dv = D.data.value[idx];
				C.data.value[idx] = dv;
				D.data.value[idx] = cv;
			}
		}
	}
	class SystemCE extends createSystem({ q: { required: [C, E] } }) {
		update() {
			for (const e of this.queries.q.entities) {
				const idx = e.index;
				const cv = C.data.value[idx];
				const ev = E.data.value[idx];
				C.data.value[idx] = ev;
				E.data.value[idx] = cv;
			}
		}
	}

	world
		.registerComponent(A)
		.registerComponent(B)
		.registerComponent(C)
		.registerComponent(D)
		.registerComponent(E);
	world
		.registerSystem(SystemAB)
		.registerSystem(SystemCD)
		.registerSystem(SystemCE);

	for (let i = 0; i < 1000; i++) {
		world.createEntity().addComponent(A).addComponent(B);
	}
	for (let i = 0; i < 1000; i++) {
		world.createEntity().addComponent(A).addComponent(B).addComponent(C);
	}
	for (let i = 0; i < 1000; i++) {
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(D);
	}
	for (let i = 0; i < 1000; i++) {
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(E);
	}

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function fragmentedIteration() {
	const world = new EliWorld({ entityCapacity: 3000, checksOn: false });
	const Data = createComponent('Data', {
		value: { type: Types.Float32, default: 0 },
	});
	const comps = [];
	for (let i = 0; i < 26; i++) {
		comps[i] = createComponent(`Comp${i}`, {
			value: { type: Types.Float32, default: 0 },
		});
		world.registerComponent(comps[i]);
	}
	world.registerComponent(Data);

	class FragSystem extends createSystem({
		data: { required: [Data] },
		z: { required: [comps[25]] },
	}) {
		update() {
			for (const e of this.queries.data.entities) {
				const idx = e.index;
				Data.data.value[idx] *= 2;
			}
			for (const e of this.queries.z.entities) {
				const idx = e.index;
				comps[25].data.value[idx] *= 2;
			}
		}
	}

	world.registerSystem(FragSystem);

	for (let i = 0; i < 26; i++) {
		for (let j = 0; j < 100; j++) {
			world.createEntity().addComponent(comps[i]).addComponent(Data);
		}
	}

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function fragmentedIteration256() {
	const world = new EliWorld({ entityCapacity: 30000, checksOn: false });
	const Data = createComponent('Data', {
		value: { type: Types.Float32, default: 0 },
	});
	const comps = [];
	for (let i = 0; i < 256; i++) {
		comps[i] = createComponent(`Comp${i}`, {
			value: { type: Types.Float32, default: 0 },
		});
		world.registerComponent(comps[i]);
	}
	world.registerComponent(Data);

	class FragSystem extends createSystem({
		data: { required: [Data] },
		hi: { required: [comps[255]] },
	}) {
		update() {
			for (const e of this.queries.data.entities) {
				const idx = e.index;
				Data.data.value[idx] *= 2;
			}
			for (const e of this.queries.hi.entities) {
				const idx = e.index;
				comps[255].data.value[idx] *= 2;
			}
		}
	}

	world.registerSystem(FragSystem);
	for (let i = 0; i < 256; i++) {
		for (let j = 0; j < 100; j++) {
			world.createEntity().addComponent(comps[i]).addComponent(Data);
		}
	}

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function valueFilterManual() {
	const COUNT = 5000;
	const world = new EliWorld({ entityCapacity: COUNT + 100, checksOn: false });
	const Value = createComponent('Value', {
		value: { type: Types.Float32, default: 0 },
	});

	world.registerComponent(Value);

	for (let i = 0; i < COUNT; i++) {
		world.createEntity().addComponent(Value, { value: i % 10 });
	}

	const eqVal = 5;
	const ltVal = 5;
	const leVal = 5;
	const gtVal = 5;
	const geVal = 5;
	const inSet = new Set([1, 3, 5, 7, 9]);

	class ValueFilterSystem extends createSystem({ q: { required: [Value] } }) {
		update() {
			let eq = 0,
				ne = 0,
				lt = 0,
				le = 0,
				gt = 0,
				ge = 0,
				ischk = 0,
				nischk = 0;
			for (const e of this.queries.q.entities) {
				const v = Value.data.value[e.index];
				if (v === eqVal) {
					eq++;
				}
				if (v !== eqVal) {
					ne++;
				}
				if (v < ltVal) {
					lt++;
				}
				if (v <= leVal) {
					le++;
				}
				if (v > gtVal) {
					gt++;
				}
				if (v >= geVal) {
					ge++;
				}
				if (inSet.has(v)) {
					ischk++;
				}
				if (!inSet.has(v)) {
					nischk++;
				}
			}
			// prevent V8 from optimizing away counters
			Value._lastCounts = eq + ne + lt + le + gt + ge + ischk + nischk;
		}
	}

	world.registerSystem(ValueFilterSystem);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function entityCycle() {
	const world = new EliWorld({ entityCapacity: 2000, checksOn: false });
	const A = createComponent('A', {
		value: { type: Types.Float32, default: 0 },
	});
	const B = createComponent('B', {
		value: { type: Types.Float32, default: 0 },
	});

	class CycleSystem extends createSystem({
		as: { required: [A] },
		bs: { required: [B] },
	}) {
		update() {
			for (const _entity of this.queries.as.entities) {
				world.createEntity().addComponent(B);
			}
			for (const e of this.queries.bs.entities) {
				e.destroy();
			}
		}
	}

	world.registerComponent(A).registerComponent(B).registerSystem(CycleSystem);
	for (let i = 0; i < 1000; i++) {
		world.createEntity().addComponent(A);
	}
	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

export function addRemove() {
	const world = new EliWorld({
		entityCapacity: 1000,
		checksOn: false,
	});
	const A = createComponent('A', {
		value: { type: Types.Float32, default: 0 },
	});
	const B = createComponent('B', {
		value: { type: Types.Float32, default: 0 },
	});

	class AddRemoveSystem extends createSystem({
		as: { required: [A] },
		bs: { required: [B] },
	}) {
		update() {
			for (const e of this.queries.as.entities) {
				e.addComponent(B);
			}
			for (const e of this.queries.bs.entities) {
				e.removeComponent(B);
			}
		}
	}

	world
		.registerComponent(A)
		.registerComponent(B)
		.registerSystem(AddRemoveSystem);
	for (let i = 0; i < 1000; i++) {
		world.createEntity().addComponent(A);
	}
	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			world.update(0, 0);
		}
	});
}

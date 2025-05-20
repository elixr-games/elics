import { performance } from 'node:perf_hooks';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
	World as EliWorld,
	createComponent,
	createSystem,
	Types,
} from '../lib/index.js';
import {
	World as EcsyWorld,
	System as EcsySystem,
	Component as EcsyComponent,
	Types as EcsyTypes,
} from 'ecsy';
import {
	World as BecsyWorld,
	System as BecsySystem,
	component as becsyComponent,
	field as becsyField,
} from '@lastolivegames/becsy/perf.js';

// Silence ecsy warnings in console
console.warn = () => {};

const ITERATIONS = 100;

function time(fn) {
	const start = performance.now();
	fn();
	return performance.now() - start;
}

async function timeAsync(fn) {
	const start = performance.now();
	await fn();
	return performance.now() - start;
}

// EliCS benchmarks
function packedIterationElics() {
	const world = new EliWorld({ entityCapacity: 1000, checksOn: false });
	const A = createComponent({ value: { type: Types.Float32, default: 1 } });
	const B = createComponent({ value: { type: Types.Float32, default: 1 } });
	const C = createComponent({ value: { type: Types.Float32, default: 1 } });
	const D = createComponent({ value: { type: Types.Float32, default: 1 } });
	const E = createComponent({ value: { type: Types.Float32, default: 1 } });

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
		for (let i = 0; i < ITERATIONS; i++) world.update(0, 0);
	});
}

function simpleIterationElics() {
	const world = new EliWorld({ entityCapacity: 5000, checksOn: false });
	const A = createComponent({ value: { type: Types.Float32, default: 0 } });
	const B = createComponent({ value: { type: Types.Float32, default: 0 } });
	const C = createComponent({ value: { type: Types.Float32, default: 0 } });
	const D = createComponent({ value: { type: Types.Float32, default: 0 } });
	const E = createComponent({ value: { type: Types.Float32, default: 0 } });

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

	for (let i = 0; i < 1000; i++)
		world.createEntity().addComponent(A).addComponent(B);
	for (let i = 0; i < 1000; i++)
		world.createEntity().addComponent(A).addComponent(B).addComponent(C);
	for (let i = 0; i < 1000; i++)
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(D);
	for (let i = 0; i < 1000; i++)
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(E);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.update(0, 0);
	});
}

function fragmentedIterationElics() {
	const world = new EliWorld({ entityCapacity: 3000, checksOn: false });
	const Data = createComponent({ value: { type: Types.Float32, default: 0 } });
	const comps = [];
	for (let i = 0; i < 26; i++) {
		comps[i] = createComponent({ value: { type: Types.Float32, default: 0 } });
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
		for (let i = 0; i < ITERATIONS; i++) world.update(0, 0);
	});
}

function entityCycleElics() {
	const world = new EliWorld({ entityCapacity: 2000, checksOn: false });
	const A = createComponent({ value: { type: Types.Float32, default: 0 } });
	const B = createComponent({ value: { type: Types.Float32, default: 0 } });

	class CycleSystem extends createSystem({
		as: { required: [A] },
		bs: { required: [B] },
	}) {
		update() {
			for (const _ of this.queries.as.entities) {
				world.createEntity().addComponent(B);
			}
			for (const e of Array.from(this.queries.bs.entities)) {
				e.destroy();
			}
		}
	}

	world.registerComponent(A).registerComponent(B).registerSystem(CycleSystem);
	for (let i = 0; i < 1000; i++) world.createEntity().addComponent(A);
	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.update(0, 0);
	});
}

function addRemoveElics() {
	const world = new EliWorld({
		entityCapacity: 1000,
		checksOn: false,
		deferredEntityUpdates: true,
	});
	const A = createComponent({ value: { type: Types.Float32, default: 0 } });
	const B = createComponent({ value: { type: Types.Float32, default: 0 } });

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
	for (let i = 0; i < 1000; i++) world.createEntity().addComponent(A);
	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.update(0, 0);
	});
}

// ecsy benchmarks
class ValueCompEcsy extends EcsyComponent {}
ValueCompEcsy.schema = { value: { type: EcsyTypes.Number, default: 0 } };

function createLetterComponentsEcsy(n) {
	const out = [];
	for (let i = 0; i < n; i++) {
		class C extends EcsyComponent {}
		C.schema = { value: { type: EcsyTypes.Number, default: 0 } };
		out.push(C);
	}
	return out;
}

function packedIterationEcsy() {
	const world = new EcsyWorld();
	const [A, B, C, D, E] = createLetterComponentsEcsy(5);
	class PackedSystem extends EcsySystem {
		execute() {
			this.queries.a.results.forEach((e) => {
				const c = e.getMutableComponent(A);
				c.value *= 2;
			});
			this.queries.b.results.forEach((e) => {
				const c = e.getMutableComponent(B);
				c.value *= 2;
			});
			this.queries.c.results.forEach((e) => {
				const c = e.getMutableComponent(C);
				c.value *= 2;
			});
			this.queries.d.results.forEach((e) => {
				const c = e.getMutableComponent(D);
				c.value *= 2;
			});
			this.queries.e.results.forEach((e) => {
				const c = e.getMutableComponent(E);
				c.value *= 2;
			});
		}
	}
	PackedSystem.queries = {
		a: { components: [A] },
		b: { components: [B] },
		c: { components: [C] },
		d: { components: [D] },
		e: { components: [E] },
	};

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
		for (let i = 0; i < ITERATIONS; i++) world.execute(0);
	});
}

function simpleIterationEcsy() {
	const world = new EcsyWorld();
	const [A, B, C, D, E] = createLetterComponentsEcsy(5);

	class SystemAB extends EcsySystem {
		execute() {
			this.queries.q.results.forEach((e) => {
				const a = e.getMutableComponent(A);
				const b = e.getMutableComponent(B);
				const tmp = a.value;
				a.value = b.value;
				b.value = tmp;
			});
		}
	}
	SystemAB.queries = { q: { components: [A, B] } };

	class SystemCD extends EcsySystem {
		execute() {
			this.queries.q.results.forEach((e) => {
				const c = e.getMutableComponent(C);
				const d = e.getMutableComponent(D);
				const tmp = c.value;
				c.value = d.value;
				d.value = tmp;
			});
		}
	}
	SystemCD.queries = { q: { components: [C, D] } };

	class SystemCE extends EcsySystem {
		execute() {
			this.queries.q.results.forEach((e) => {
				const c = e.getMutableComponent(C);
				const ev = e.getMutableComponent(E);
				const tmp = c.value;
				c.value = ev.value;
				ev.value = tmp;
			});
		}
	}
	SystemCE.queries = { q: { components: [C, E] } };

	world
		.registerComponent(A)
		.registerComponent(B)
		.registerComponent(C)
		.registerComponent(D)
		.registerComponent(E)
		.registerSystem(SystemAB)
		.registerSystem(SystemCD)
		.registerSystem(SystemCE);

	for (let i = 0; i < 1000; i++)
		world.createEntity().addComponent(A).addComponent(B);
	for (let i = 0; i < 1000; i++)
		world.createEntity().addComponent(A).addComponent(B).addComponent(C);
	for (let i = 0; i < 1000; i++)
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(D);
	for (let i = 0; i < 1000; i++)
		world
			.createEntity()
			.addComponent(A)
			.addComponent(B)
			.addComponent(C)
			.addComponent(E);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.execute(0);
	});
}

function fragmentedIterationEcsy() {
	const world = new EcsyWorld();
	class Data extends EcsyComponent {}
	Data.schema = { value: { type: EcsyTypes.Number, default: 0 } };
	const comps = createLetterComponentsEcsy(26);

	class FragSystem extends EcsySystem {
		execute() {
			this.queries.data.results.forEach((e) => {
				const c = e.getMutableComponent(Data);
				c.value *= 2;
			});
			this.queries.z.results.forEach((e) => {
				const c = e.getMutableComponent(comps[25]);
				c.value *= 2;
			});
		}
	}
	FragSystem.queries = {
		data: { components: [Data] },
		z: { components: [comps[25]] },
	};

	world.registerComponent(Data);
	comps.forEach((c) => world.registerComponent(c));
	world.registerSystem(FragSystem);

	for (let i = 0; i < 26; i++) {
		for (let j = 0; j < 100; j++) {
			world.createEntity().addComponent(comps[i]).addComponent(Data);
		}
	}

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.execute(0);
	});
}

function entityCycleEcsy() {
	const world = new EcsyWorld();
	const [A, B] = createLetterComponentsEcsy(2);

	class CycleSystem extends EcsySystem {
		execute() {
			this.queries.as.results.forEach(() => {
				world.createEntity().addComponent(B);
			});
			this.queries.bs.results.slice().forEach((e) => {
				e.remove();
			});
		}
	}
	CycleSystem.queries = {
		as: { components: [A] },
		bs: { components: [B] },
	};

	world.registerComponent(A).registerComponent(B).registerSystem(CycleSystem);
	for (let i = 0; i < 1000; i++) world.createEntity().addComponent(A);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.execute(0);
	});
}

function addRemoveEcsy() {
	const world = new EcsyWorld();
	const [A, B] = createLetterComponentsEcsy(2);

	class AddRemoveSystem extends EcsySystem {
		execute() {
			this.queries.as.results.forEach((e) => {
				e.addComponent(B);
			});
			this.queries.bs.results.forEach((e) => {
				e.removeComponent(B);
			});
		}
	}
	AddRemoveSystem.queries = {
		as: { components: [A] },
		bs: { components: [B] },
	};

	world
		.registerComponent(A)
		.registerComponent(B)
		.registerSystem(AddRemoveSystem);
	for (let i = 0; i < 1000; i++) world.createEntity().addComponent(A);

	return time(() => {
		for (let i = 0; i < ITERATIONS; i++) world.execute(0);
	});
}

// becsy benchmarks
async function packedIterationBecsy() {
	class A1 {}
	becsyField.float32(A1.prototype, 'value');
	becsyComponent(A1);
	class B1 {}
	becsyField.float32(B1.prototype, 'value');
	becsyComponent(B1);
	class C1 {}
	becsyField.float32(C1.prototype, 'value');
	becsyComponent(C1);
	class D1 {}
	becsyField.float32(D1.prototype, 'value');
	becsyComponent(D1);
	class E1 {}
	becsyField.float32(E1.prototype, 'value');
	becsyComponent(E1);

	class PackedSystem extends BecsySystem {
		a = this.query((q) => q.current.with(A1).write);
		b = this.query((q) => q.current.with(B1).write);
		c = this.query((q) => q.current.with(C1).write);
		d = this.query((q) => q.current.with(D1).write);
		e = this.query((q) => q.current.with(E1).write);
		execute() {
			for (const ent of this.a.current) ent.write(A1).value *= 2;
			for (const ent of this.b.current) ent.write(B1).value *= 2;
			for (const ent of this.c.current) ent.write(C1).value *= 2;
			for (const ent of this.d.current) ent.write(D1).value *= 2;
			for (const ent of this.e.current) ent.write(E1).value *= 2;
		}
	}

	const world = await BecsyWorld.create({
		defs: [A1, B1, C1, D1, E1, PackedSystem],
	});
	world.build((s) => {
		for (let i = 0; i < 1000; i++) s.createEntity(A1, B1, C1, D1, E1);
	});

	const result = await timeAsync(async () => {
		for (let i = 0; i < ITERATIONS; i++) await world.execute(0);
	});
	await world.terminate();
	return result;
}

async function simpleIterationBecsy() {
	class A2 {}
	becsyField.float32(A2.prototype, 'value');
	becsyComponent(A2);
	class B2 {}
	becsyField.float32(B2.prototype, 'value');
	becsyComponent(B2);
	class C2 {}
	becsyField.float32(C2.prototype, 'value');
	becsyComponent(C2);
	class D2 {}
	becsyField.float32(D2.prototype, 'value');
	becsyComponent(D2);
	class E2 {}
	becsyField.float32(E2.prototype, 'value');
	becsyComponent(E2);

	class SystemAB extends BecsySystem {
		q = this.query((q) => q.current.with(A2, B2).write);
		execute() {
			for (const ent of this.q.current) {
				const av = ent.write(A2).value;
				const bv = ent.write(B2).value;
				ent.write(A2).value = bv;
				ent.write(B2).value = av;
			}
		}
	}

	class SystemCD extends BecsySystem {
		q = this.query((q) => q.current.with(C2, D2).write);
		execute() {
			for (const ent of this.q.current) {
				const cv = ent.write(C2).value;
				const dv = ent.write(D2).value;
				ent.write(C2).value = dv;
				ent.write(D2).value = cv;
			}
		}
	}

	class SystemCE extends BecsySystem {
		q = this.query((q) => q.current.with(C2, E2).write);
		sched = this.schedule((s) => s.after(SystemCD));
		execute() {
			for (const ent of this.q.current) {
				const cv = ent.write(C2).value;
				const ev = ent.write(E2).value;
				ent.write(C2).value = ev;
				ent.write(E2).value = cv;
			}
		}
	}

	const world = await BecsyWorld.create({
		defs: [A2, B2, C2, D2, E2, SystemAB, SystemCD, SystemCE],
	});
	world.build((s) => {
		for (let i = 0; i < 1000; i++) s.createEntity(A2, B2);
		for (let i = 0; i < 1000; i++) s.createEntity(A2, B2, C2);
		for (let i = 0; i < 1000; i++) s.createEntity(A2, B2, C2, D2);
		for (let i = 0; i < 1000; i++) s.createEntity(A2, B2, C2, E2);
	});

	const result = await timeAsync(async () => {
		for (let i = 0; i < ITERATIONS; i++) await world.execute(0);
	});
	await world.terminate();
	return result;
}

async function fragmentedIterationBecsy() {
	class DataF {}
	becsyField.float32(DataF.prototype, 'value');
	becsyComponent(DataF);
	const comps = [];
	for (let i = 0; i < 26; i++) {
		const C = new Function(`return class F${i} {}`)();
		becsyField.float32(C.prototype, 'value');
		becsyComponent(C);
		comps[i] = C;
	}

	class FragSystem extends BecsySystem {
		data = this.query((q) => q.current.with(DataF).write);
		z = this.query((q) => q.current.with(comps[25]).write);
		execute() {
			for (const ent of this.data.current) ent.write(DataF).value *= 2;
			for (const ent of this.z.current) ent.write(comps[25]).value *= 2;
		}
	}

	const world = await BecsyWorld.create({
		defs: [DataF, ...comps, FragSystem],
	});
	world.build((s) => {
		for (let i = 0; i < 26; i++) {
			for (let j = 0; j < 100; j++) {
				s.createEntity(comps[i], DataF);
			}
		}
	});

	const result = await timeAsync(async () => {
		for (let i = 0; i < ITERATIONS; i++) await world.execute(0);
	});
	await world.terminate();
	return result;
}

async function entityCycleBecsy() {
	class A3 {}
	becsyField.float32(A3.prototype, 'value');
	becsyComponent(A3);
	class B3 {}
	becsyField.float32(B3.prototype, 'value');
	becsyComponent(B3);

	class CycleSystem extends BecsySystem {
		as = this.query((q) => q.current.with(A3));
		bs = this.query((q) => q.current.with(B3));
		perm = this.query((q) => q.using(B3).write);
		execute() {
			for (const _ of this.as.current) {
				this.createEntity(B3);
			}
			for (const ent of [...this.bs.current]) {
				ent.delete();
			}
		}
	}

	const world = await BecsyWorld.create({
		defs: [A3, B3, CycleSystem],
		maxLimboComponents: 10000,
	});
	world.build((s) => {
		for (let i = 0; i < 1000; i++) s.createEntity(A3);
	});

	const result = await timeAsync(async () => {
		for (let i = 0; i < ITERATIONS; i++) await world.execute(0);
	});
	await world.terminate();
	return result;
}

async function addRemoveBecsy() {
	class A4 {}
	becsyField.float32(A4.prototype, 'value');
	becsyComponent(A4);
	class B4 {}
	becsyField.float32(B4.prototype, 'value');
	becsyComponent(B4);

	class AddRemoveSystem extends BecsySystem {
		as = this.query((q) => q.current.with(A4).without(B4));
		bs = this.query((q) => q.current.with(B4));
		perm = this.query((q) => q.using(B4).write);
		execute() {
			for (const ent of this.as.current) {
				ent.add(B4);
			}
			for (const ent of this.bs.current) {
				ent.remove(B4);
			}
		}
	}

	const world = await BecsyWorld.create({
		defs: [A4, B4, AddRemoveSystem],
		maxLimboComponents: 10000,
	});
	world.build((s) => {
		for (let i = 0; i < 1000; i++) s.createEntity(A4);
	});

	const result = await timeAsync(async () => {
		for (let i = 0; i < ITERATIONS; i++) await world.execute(0);
	});
	await world.terminate();
	return result;
}

const suites = [
	[
		'Packed Iteration',
		packedIterationElics,
		packedIterationEcsy,
		packedIterationBecsy,
	],
	[
		'Simple Iteration',
		simpleIterationElics,
		simpleIterationEcsy,
		simpleIterationBecsy,
	],
	[
		'Fragmented Iteration',
		fragmentedIterationElics,
		fragmentedIterationEcsy,
		fragmentedIterationBecsy,
	],
	['Entity Cycle', entityCycleElics, entityCycleEcsy, entityCycleBecsy],
	['Add / Remove', addRemoveElics, addRemoveEcsy, addRemoveBecsy],
];

const results = [];

async function run() {
	for (const [name, elicsFn, ecsyFn, becsyFn] of suites) {
		try {
			const elicsTime = elicsFn();
			const ecsyTime = ecsyFn();
			const becsyTime = await becsyFn();
			results.push({ name, elicsTime, ecsyTime, becsyTime });

			console.log(`${name}:`);
			console.log(`  EliCS: ${elicsTime.toFixed(2)} ms`);
			console.log(`  ecsy:  ${ecsyTime.toFixed(2)} ms`);
			console.log(`  becsy: ${becsyTime.toFixed(2)} ms`);
		} catch (err) {
			console.error(`Failed to run ${name}:`, err.message);
		}
	}

	updateReadme(results);
}

await run();

function updateReadme(res) {
	const readmePath = path.resolve(
		path.dirname(fileURLToPath(import.meta.url)),
		'..',
		'README.md',
	);
	let text = fs.readFileSync(readmePath, 'utf8');
	const start = '<!-- benchmark-start -->';
	const end = '<!-- benchmark-end -->';
	const startIdx = text.indexOf(start);
	const endIdx = text.indexOf(end);
	if (startIdx === -1 || endIdx === -1 || endIdx < startIdx) {
		console.error('Benchmark markers missing in README');
		return;
	}

	const lines = res.map((r) => {
		const el = r.elicsTime.toFixed(2);
		const ec = r.ecsyTime.toFixed(2);
		const bc = r.becsyTime.toFixed(2);
		const fastest = Math.min(r.elicsTime, r.ecsyTime, r.becsyTime);
		const slowest = Math.max(r.elicsTime, r.ecsyTime, r.becsyTime);
		const percent = (((slowest - fastest) / slowest) * 100).toFixed(0);
		const elBold =
			r.elicsTime === fastest ? `**EliCS ${el} ms**` : `EliCS ${el} ms`;
		const ecBold =
			r.ecsyTime === fastest ? `**ecsy ${ec} ms**` : `ecsy ${ec} ms`;
		const bcBold =
			r.becsyTime === fastest ? `**becsy ${bc} ms**` : `becsy ${bc} ms`;
		return `- **${r.name}**: ${elBold} | ${ecBold} | ${bcBold} (${percent}% better)`;
	});

	const before = text.slice(0, startIdx + start.length);
	const after = text.slice(endIdx);
	text = `${before}\n${lines.join('\n')}\n${after}`;
	fs.writeFileSync(readmePath, text);
}

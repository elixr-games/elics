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

// Silence ecsy warnings in console
console.warn = () => {};

const ITERATIONS = 100;

function time(fn) {
	const start = performance.now();
	fn();
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

const suites = [
	['Packed Iteration', packedIterationElics, packedIterationEcsy],
	['Simple Iteration', simpleIterationElics, simpleIterationEcsy],
	['Fragmented Iteration', fragmentedIterationElics, fragmentedIterationEcsy],
	['Entity Cycle', entityCycleElics, entityCycleEcsy],
	['Add / Remove', addRemoveElics, addRemoveEcsy],
];

const results = [];

for (const [name, elicsFn, ecsyFn] of suites) {
       try {
               const elicsTime = elicsFn();
               const ecsyTime = ecsyFn();
               results.push({ name, elicsTime, ecsyTime });

               console.log(`${name}:`);
               console.log(`  EliCS: ${elicsTime.toFixed(2)} ms`);
               console.log(`  ecsy:  ${ecsyTime.toFixed(2)} ms`);

       } catch (err) {
               console.error(`Failed to run ${name}:`, err.message);
       }
}

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
               const elicsFaster = r.elicsTime <= r.ecsyTime;
               const faster = elicsFaster ? r.ecsyTime : r.elicsTime;
               const slower = elicsFaster ? r.elicsTime : r.ecsyTime;
               const percent = (((faster - slower) / faster) * 100).toFixed(0);
               if (elicsFaster) {
                       return `- **${r.name}**: **EliCS ${el} ms** | ecsy ${ec} ms (${percent}% better)`;
               }
               return `- **${r.name}**: EliCS ${el} ms | **ecsy ${ec} ms** (${percent}% better)`;
       });

       const before = text.slice(0, startIdx + start.length);
       const after = text.slice(endIdx);
       text = `${before}\n${lines.join('\n')}\n${after}`;
       fs.writeFileSync(readmePath, text);
}

updateReadme(results);

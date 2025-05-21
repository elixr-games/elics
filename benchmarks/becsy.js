import {
        World as BecsyWorld,
        System as BecsySystem,
        component as becsyComponent,
        field as becsyField,
} from '@lastolivegames/becsy/perf.js';
import { timeAsync, ITERATIONS } from './bench-util.js';

const letterComponentCache = new Map();

function getLetterComponentsBecsy(n, key = n) {
	if (!letterComponentCache.has(key)) {
		const arr = [];
		for (let i = 0; i < n; i++) {
			const C = new Function(`return class ${key}C${i} {}`)();
			becsyField.float32(C.prototype, 'value');
			becsyComponent(C);
			arr.push(C);
		}
		letterComponentCache.set(key, arr);
	}
	return letterComponentCache.get(key);
}

let dataFComponent;
function getDataFComponent() {
	if (!dataFComponent) {
		class DataF {}
		becsyField.float32(DataF.prototype, 'value');
		becsyComponent(DataF);
		dataFComponent = DataF;
	}
	return dataFComponent;
}

export async function packedIteration() {
	const [A1, B1, C1, D1, E1] = getLetterComponentsBecsy(5, 'packed');

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

export async function simpleIteration() {
	const [A2, B2, C2, D2, E2] = getLetterComponentsBecsy(5, 'simple');

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

export async function fragmentedIteration() {
	const DataF = getDataFComponent();
	const comps = getLetterComponentsBecsy(26, 'fragmented');

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

export async function entityCycle() {
	const [A3, B3] = getLetterComponentsBecsy(2, 'cycle');

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

export async function addRemove() {
	const [A4, B4] = getLetterComponentsBecsy(2, 'addRemove');

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

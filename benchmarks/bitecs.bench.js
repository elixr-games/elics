import {
	createWorld,
	defineComponent,
	defineQuery,
	addEntity,
	addComponent,
	removeEntity,
	removeComponent,
	Types,
	deleteWorld,
} from 'bitecs';
import { time, ITERATIONS } from './bench-util.js';

// Silence ecsy warnings in console
console.warn = () => {};

export function packedIteration() {
	const world = createWorld();
	const A = defineComponent({ value: Types.f32 });
	const B = defineComponent({ value: Types.f32 });
	const C = defineComponent({ value: Types.f32 });
	const D = defineComponent({ value: Types.f32 });
	const E = defineComponent({ value: Types.f32 });

	const qA = defineQuery([A]);
	const qB = defineQuery([B]);
	const qC = defineQuery([C]);
	const qD = defineQuery([D]);
	const qE = defineQuery([E]);

	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
		addComponent(world, B, eid);
		addComponent(world, C, eid);
		addComponent(world, D, eid);
		addComponent(world, E, eid);
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const as = qA(world);
			for (let j = 0; j < as.length; j++) {
				const id = as[j];
				A.value[id] *= 2;
			}
			const bs = qB(world);
			for (let j = 0; j < bs.length; j++) {
				const id = bs[j];
				B.value[id] *= 2;
			}
			const cs = qC(world);
			for (let j = 0; j < cs.length; j++) {
				const id = cs[j];
				C.value[id] *= 2;
			}
			const ds = qD(world);
			for (let j = 0; j < ds.length; j++) {
				const id = ds[j];
				D.value[id] *= 2;
			}
			const es = qE(world);
			for (let j = 0; j < es.length; j++) {
				const id = es[j];
				E.value[id] *= 2;
			}
		}
	});

	deleteWorld(world);
	return result;
}

export function simpleIteration() {
	const world = createWorld();
	const A = defineComponent({ value: Types.f32 });
	const B = defineComponent({ value: Types.f32 });
	const C = defineComponent({ value: Types.f32 });
	const D = defineComponent({ value: Types.f32 });
	const E = defineComponent({ value: Types.f32 });

	const qAB = defineQuery([A, B]);
	const qCD = defineQuery([C, D]);
	const qCE = defineQuery([C, E]);

	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
		addComponent(world, B, eid);
	}
	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
		addComponent(world, B, eid);
		addComponent(world, C, eid);
	}
	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
		addComponent(world, B, eid);
		addComponent(world, C, eid);
		addComponent(world, D, eid);
	}
	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
		addComponent(world, B, eid);
		addComponent(world, C, eid);
		addComponent(world, E, eid);
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const ab = qAB(world);
			for (let j = 0; j < ab.length; j++) {
				const id = ab[j];
				const av = A.value[id];
				const bv = B.value[id];
				A.value[id] = bv;
				B.value[id] = av;
			}

			const cd = qCD(world);
			for (let j = 0; j < cd.length; j++) {
				const id = cd[j];
				const cv = C.value[id];
				const dv = D.value[id];
				C.value[id] = dv;
				D.value[id] = cv;
			}

			const ce = qCE(world);
			for (let j = 0; j < ce.length; j++) {
				const id = ce[j];
				const cv = C.value[id];
				const ev = E.value[id];
				C.value[id] = ev;
				E.value[id] = cv;
			}
		}
	});

	deleteWorld(world);
	return result;
}

export function fragmentedIteration() {
	const world = createWorld();
	const Data = defineComponent({ value: Types.f32 });
	const comps = [];
	for (let i = 0; i < 26; i++) {
		comps[i] = defineComponent({ value: Types.f32 });
	}

	const qData = defineQuery([Data]);
	const qZ = defineQuery([comps[25]]);

	for (let i = 0; i < 26; i++) {
		for (let j = 0; j < 100; j++) {
			const eid = addEntity(world);
			addComponent(world, comps[i], eid);
			addComponent(world, Data, eid);
		}
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const data = qData(world);
			for (let j = 0; j < data.length; j++) {
				const id = data[j];
				Data.value[id] *= 2;
			}
			const zs = qZ(world);
			for (let j = 0; j < zs.length; j++) {
				const id = zs[j];
				comps[25].value[id] *= 2;
			}
		}
	});

	deleteWorld(world);
	return result;
}

export function fragmentedIteration256() {
	const world = createWorld();
	const Data = defineComponent({ value: Types.f32 });
	const comps = [];
	for (let i = 0; i < 256; i++)
		comps[i] = defineComponent({ value: Types.f32 });

	const qData = defineQuery([Data]);
	const qHi = defineQuery([comps[255]]);

	for (let i = 0; i < 256; i++) {
		for (let j = 0; j < 100; j++) {
			const eid = addEntity(world);
			addComponent(world, comps[i], eid);
			addComponent(world, Data, eid);
		}
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const data = qData(world);
			for (let j = 0; j < data.length; j++) {
				const id = data[j];
				Data.value[id] *= 2;
			}
			const hi = qHi(world);
			for (let j = 0; j < hi.length; j++) {
				const id = hi[j];
				comps[255].value[id] *= 2;
			}
		}
	});

	deleteWorld(world);
	return result;
}

export function valueFilterManual() {
	const world = createWorld();
	const Value = defineComponent({ value: Types.f32 });
	const qV = defineQuery([Value]);

	for (let i = 0; i < 5000; i++) {
		const eid = addEntity(world);
		addComponent(world, Value, eid);
		Value.value[eid] = i % 10;
	}

	const inSet = new Set([1, 3, 5, 7, 9]);

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			let eq = 0,
				ne = 0,
				lt = 0,
				le = 0,
				gt = 0,
				ge = 0,
				ischk = 0,
				nischk = 0;
			const ents = qV(world);
			for (let j = 0; j < ents.length; j++) {
				const id = ents[j];
				const v = Value.value[id];
				if (v === 5) eq++;
				if (v !== 5) ne++;
				if (v < 5) lt++;
				if (v <= 5) le++;
				if (v > 5) gt++;
				if (v >= 5) ge++;
				if (inSet.has(v)) ischk++;
				if (!inSet.has(v)) nischk++;
			}
			Value._lastCounts = eq + ne + lt + le + gt + ge + ischk + nischk;
		}
	});

	deleteWorld(world);
	return result;
}

export function entityCycle() {
	const world = createWorld();
	const A = defineComponent({ value: Types.f32 });
	const B = defineComponent({ value: Types.f32 });

	const qA = defineQuery([A]);
	const qB = defineQuery([B]);

	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const as = qA(world);
			for (let j = 0; j < as.length; j++) {
				const eid = addEntity(world);
				addComponent(world, B, eid);
			}
			const bs = qB(world).slice();
			for (let j = 0; j < bs.length; j++) {
				removeEntity(world, bs[j]);
			}
		}
	});

	deleteWorld(world);
	return result;
}

export function addRemove() {
	const world = createWorld();
	const A = defineComponent({ value: Types.f32 });
	const B = defineComponent({ value: Types.f32 });

	const qA = defineQuery([A]);
	const qB = defineQuery([B]);

	for (let i = 0; i < 1000; i++) {
		const eid = addEntity(world);
		addComponent(world, A, eid);
	}

	const result = time(() => {
		for (let i = 0; i < ITERATIONS; i++) {
			const as = qA(world);
			for (let j = 0; j < as.length; j++) {
				addComponent(world, B, as[j]);
			}
			const bs = qB(world);
			for (let j = 0; j < bs.length; j++) {
				removeComponent(world, B, bs[j]);
			}
		}
	});

	deleteWorld(world);
	return result;
}

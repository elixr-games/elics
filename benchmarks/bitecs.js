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

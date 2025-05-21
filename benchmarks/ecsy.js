import {
        World as EcsyWorld,
        System as EcsySystem,
        Component as EcsyComponent,
        Types as EcsyTypes,
} from 'ecsy';
import { time, ITERATIONS } from './bench-util.js';

class ValueCompEcsy extends EcsyComponent {}
ValueCompEcsy.schema = { value: { type: EcsyTypes.Number, default: 0 } };

const letterComponentCache = new Map();

function createLetterComponentsEcsy(n, key = n) {
	if (!letterComponentCache.has(key)) {
		const out = [];
		for (let i = 0; i < n; i++) {
			class C extends EcsyComponent {}
			C.schema = { value: { type: EcsyTypes.Number, default: 0 } };
			out.push(C);
		}
		letterComponentCache.set(key, out);
	}
	return letterComponentCache.get(key);
}

let dataComponent;
function getDataComponent() {
	if (!dataComponent) {
		class Data extends EcsyComponent {}
		Data.schema = { value: { type: EcsyTypes.Number, default: 0 } };
		dataComponent = Data;
	}
	return dataComponent;
}

export function packedIteration() {
	const world = new EcsyWorld();
	const [A, B, C, D, E] = createLetterComponentsEcsy(5, 'packed');
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

export function simpleIteration() {
	const world = new EcsyWorld();
	const [A, B, C, D, E] = createLetterComponentsEcsy(5, 'simple');

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

export function fragmentedIteration() {
	const world = new EcsyWorld();
	const Data = getDataComponent();
	const comps = createLetterComponentsEcsy(26, 'fragmented');

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

export function entityCycle() {
	const world = new EcsyWorld();
	const [A, B] = createLetterComponentsEcsy(2, 'cycle');

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

export function addRemove() {
	const world = new EcsyWorld();
	const [A, B] = createLetterComponentsEcsy(2, 'addRemove');

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

import { performance } from 'node:perf_hooks';
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

function makeElicsNumberComponent() {
  return createComponent({ value: { type: Types.Int32, default: 0 } });
}

function makeEcsyNumberComponent() {
  class C extends EcsyComponent {}
  C.schema = { value: { type: EcsyTypes.Number, default: 0 } };
  return C;
}

function benchPackedElics(count, iterations) {
  const world = new EliWorld();
  const A = makeElicsNumberComponent();
  const B = makeElicsNumberComponent();
  const C = makeElicsNumberComponent();
  const D = makeElicsNumberComponent();
  const E = makeElicsNumberComponent();

  class PackedSystem extends createSystem({
    qA: { required: [A] },
    qB: { required: [B] },
    qC: { required: [C] },
    qD: { required: [D] },
    qE: { required: [E] },
  }) {
    update() {
      for (const e of this.queries.qA.entities) {
        e.setValue(A, 'value', e.getValue(A, 'value') * 2);
      }
      for (const e of this.queries.qB.entities) {
        e.setValue(B, 'value', e.getValue(B, 'value') * 2);
      }
      for (const e of this.queries.qC.entities) {
        e.setValue(C, 'value', e.getValue(C, 'value') * 2);
      }
      for (const e of this.queries.qD.entities) {
        e.setValue(D, 'value', e.getValue(D, 'value') * 2);
      }
      for (const e of this.queries.qE.entities) {
        e.setValue(E, 'value', e.getValue(E, 'value') * 2);
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

  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A)
      .addComponent(B)
      .addComponent(C)
      .addComponent(D)
      .addComponent(E);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.update(0, i);
  }
  return performance.now() - start;
}

function benchPackedEcsy(count, iterations) {
  const world = new EcsyWorld();
  const A = makeEcsyNumberComponent();
  const B = makeEcsyNumberComponent();
  const C = makeEcsyNumberComponent();
  const D = makeEcsyNumberComponent();
  const E = makeEcsyNumberComponent();

  class PackedSystem extends EcsySystem {
    execute() {
      this.queries.qA.results.forEach((e) => {
        const c = e.getMutableComponent(A);
        c.value *= 2;
      });
      this.queries.qB.results.forEach((e) => {
        const c = e.getMutableComponent(B);
        c.value *= 2;
      });
      this.queries.qC.results.forEach((e) => {
        const c = e.getMutableComponent(C);
        c.value *= 2;
      });
      this.queries.qD.results.forEach((e) => {
        const c = e.getMutableComponent(D);
        c.value *= 2;
      });
      this.queries.qE.results.forEach((e) => {
        const c = e.getMutableComponent(E);
        c.value *= 2;
      });
    }
  }
  PackedSystem.queries = {
    qA: { components: [A] },
    qB: { components: [B] },
    qC: { components: [C] },
    qD: { components: [D] },
    qE: { components: [E] },
  };

  world
    .registerComponent(A)
    .registerComponent(B)
    .registerComponent(C)
    .registerComponent(D)
    .registerComponent(E)
    .registerSystem(PackedSystem);

  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A, { value: 0 })
      .addComponent(B, { value: 0 })
      .addComponent(C, { value: 0 })
      .addComponent(D, { value: 0 })
      .addComponent(E, { value: 0 });
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.execute(0, i);
  }
  return performance.now() - start;
}

function benchSimpleElics(count, iterations) {
  const world = new EliWorld();
  const A = makeElicsNumberComponent();
  const B = makeElicsNumberComponent();
  const C = makeElicsNumberComponent();
  const D = makeElicsNumberComponent();
  const E = makeElicsNumberComponent();

  class SysAB extends createSystem({ pair: { required: [A, B] } }) {
    update() {
      for (const e of this.queries.pair.entities) {
        const a = e.getValue(A, 'value');
        const b = e.getValue(B, 'value');
        e.setValue(A, 'value', b);
        e.setValue(B, 'value', a);
      }
    }
  }
  class SysCD extends createSystem({ pair: { required: [C, D] } }) {
    update() {
      for (const e of this.queries.pair.entities) {
        const c = e.getValue(C, 'value');
        const d = e.getValue(D, 'value');
        e.setValue(C, 'value', d);
        e.setValue(D, 'value', c);
      }
    }
  }
  class SysCE extends createSystem({ pair: { required: [C, E] } }) {
    update() {
      for (const e of this.queries.pair.entities) {
        const c = e.getValue(C, 'value');
        const v = e.getValue(E, 'value');
        e.setValue(C, 'value', v);
        e.setValue(E, 'value', c);
      }
    }
  }

  world
    .registerComponent(A)
    .registerComponent(B)
    .registerComponent(C)
    .registerComponent(D)
    .registerComponent(E)
    .registerSystem(SysAB)
    .registerSystem(SysCD)
    .registerSystem(SysCE);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A).addComponent(B);
  }
  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A).addComponent(B).addComponent(C);
  }
  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A)
      .addComponent(B)
      .addComponent(C)
      .addComponent(D);
  }
  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A)
      .addComponent(B)
      .addComponent(C)
      .addComponent(E);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.update(0, i);
  }
  return performance.now() - start;
}

function benchSimpleEcsy(count, iterations) {
  const world = new EcsyWorld();
  const A = makeEcsyNumberComponent();
  const B = makeEcsyNumberComponent();
  const C = makeEcsyNumberComponent();
  const D = makeEcsyNumberComponent();
  const E = makeEcsyNumberComponent();

  class SysAB extends EcsySystem {
    execute() {
      this.queries.pair.results.forEach((e) => {
        const ac = e.getMutableComponent(A);
        const bc = e.getMutableComponent(B);
        const tmp = ac.value;
        ac.value = bc.value;
        bc.value = tmp;
      });
    }
  }
  SysAB.queries = { pair: { components: [A, B] } };

  class SysCD extends EcsySystem {
    execute() {
      this.queries.pair.results.forEach((e) => {
        const cc = e.getMutableComponent(C);
        const dc = e.getMutableComponent(D);
        const tmp = cc.value;
        cc.value = dc.value;
        dc.value = tmp;
      });
    }
  }
  SysCD.queries = { pair: { components: [C, D] } };

  class SysCE extends EcsySystem {
    execute() {
      this.queries.pair.results.forEach((e) => {
        const cc = e.getMutableComponent(C);
        const ec = e.getMutableComponent(E);
        const tmp = cc.value;
        cc.value = ec.value;
        ec.value = tmp;
      });
    }
  }
  SysCE.queries = { pair: { components: [C, E] } };

  world
    .registerComponent(A)
    .registerComponent(B)
    .registerComponent(C)
    .registerComponent(D)
    .registerComponent(E)
    .registerSystem(SysAB)
    .registerSystem(SysCD)
    .registerSystem(SysCE);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A).addComponent(B);
  }
  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A).addComponent(B).addComponent(C);
  }
  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A)
      .addComponent(B)
      .addComponent(C)
      .addComponent(D);
  }
  for (let i = 0; i < count; i++) {
    world
      .createEntity()
      .addComponent(A)
      .addComponent(B)
      .addComponent(C)
      .addComponent(E);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.execute(0, i);
  }
  return performance.now() - start;
}

function benchFragmentedElics(iterations) {
  const world = new EliWorld();
  const Data = makeElicsNumberComponent();
  const letters = [];
  for (let i = 0; i < 26; i++) {
    letters.push(makeElicsNumberComponent());
  }

  class DataSystem extends createSystem({ all: { required: [Data] } }) {
    update() {
      for (const e of this.queries.all.entities) {
        e.setValue(Data, 'value', e.getValue(Data, 'value') * 2);
      }
    }
  }
  class ZSystem extends createSystem({ withZ: { required: [letters[25]] } }) {
    update() {
      for (const e of this.queries.withZ.entities) {
        e.setValue(letters[25], 'value', e.getValue(letters[25], 'value') * 2);
      }
    }
  }

  world.registerComponent(Data);
  letters.forEach((c) => world.registerComponent(c));
  world.registerSystem(DataSystem).registerSystem(ZSystem);

  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 100; j++) {
      world.createEntity().addComponent(Data).addComponent(letters[i]);
    }
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.update(0, i);
  }
  return performance.now() - start;
}

function benchFragmentedEcsy(iterations) {
  const world = new EcsyWorld();
  const Data = makeEcsyNumberComponent();
  const letters = [];
  for (let i = 0; i < 26; i++) {
    letters.push(makeEcsyNumberComponent());
  }

  class DataSystem extends EcsySystem {
    execute() {
      this.queries.all.results.forEach((e) => {
        const c = e.getMutableComponent(Data);
        c.value *= 2;
      });
    }
  }
  DataSystem.queries = { all: { components: [Data] } };

  class ZSystem extends EcsySystem {
    execute() {
      this.queries.withZ.results.forEach((e) => {
        const c = e.getMutableComponent(letters[25]);
        c.value *= 2;
      });
    }
  }
  ZSystem.queries = { withZ: { components: [letters[25]] } };

  world.registerComponent(Data);
  letters.forEach((c) => world.registerComponent(c));
  world.registerSystem(DataSystem).registerSystem(ZSystem);

  for (let i = 0; i < 26; i++) {
    for (let j = 0; j < 100; j++) {
      world.createEntity().addComponent(Data, { value: 0 }).addComponent(letters[i], { value: 0 });
    }
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.execute(0, i);
  }
  return performance.now() - start;
}

function benchCycleElics(count, iterations) {
  const world = new EliWorld();
  const A = makeElicsNumberComponent();
  const B = makeElicsNumberComponent();

  class CycleSystem extends createSystem({ a: { required: [A] }, b: { required: [B] } }) {
    update() {
      for (const _ of this.queries.a.entities) {
        world.createEntity().addComponent(B);
      }
      for (const e of this.queries.b.entities) {
        e.destroy();
      }
    }
  }

  world.registerComponent(A).registerComponent(B).registerSystem(CycleSystem);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.update(0, i);
  }
  return performance.now() - start;
}

function benchCycleEcsy(count, iterations) {
  const world = new EcsyWorld();
  const A = makeEcsyNumberComponent();
  const B = makeEcsyNumberComponent();

  class CycleSystem extends EcsySystem {
    execute() {
      this.queries.a.results.forEach(() => {
        world.createEntity().addComponent(B, { value: 0 });
      });
      this.queries.b.results.forEach((e) => {
        e.remove();
      });
    }
  }
  CycleSystem.queries = { a: { components: [A] }, b: { components: [B] } };

  world.registerComponent(A).registerComponent(B).registerSystem(CycleSystem);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A, { value: 0 });
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.execute(0, i);
  }
  return performance.now() - start;
}

function benchAddRemoveElics(count, iterations) {
  const world = new EliWorld();
  const A = makeElicsNumberComponent();
  const B = makeElicsNumberComponent();

  class AddRemoveSystem extends createSystem({ all: { required: [A] }, withB: { required: [B] } }) {
    update() {
      for (const e of this.queries.all.entities) {
        if (!e.hasComponent(B)) {
          e.addComponent(B);
        }
      }
      for (const e of this.queries.withB.entities) {
        e.removeComponent(B);
      }
    }
  }

  world.registerComponent(A).registerComponent(B).registerSystem(AddRemoveSystem);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A);
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.update(0, i);
  }
  return performance.now() - start;
}

function benchAddRemoveEcsy(count, iterations) {
  const world = new EcsyWorld();
  const A = makeEcsyNumberComponent();
  const B = makeEcsyNumberComponent();

  class AddRemoveSystem extends EcsySystem {
    execute() {
      this.queries.all.results.forEach((e) => {
        if (!e.hasComponent(B)) {
          e.addComponent(B, { value: 0 });
        }
      });
      this.queries.withB.results.forEach((e) => {
        e.removeComponent(B);
      });
    }
  }
  AddRemoveSystem.queries = { all: { components: [A] }, withB: { components: [B] } };

  world.registerComponent(A).registerComponent(B).registerSystem(AddRemoveSystem);

  for (let i = 0; i < count; i++) {
    world.createEntity().addComponent(A, { value: 0 });
  }

  const start = performance.now();
  for (let i = 0; i < iterations; i++) {
    world.execute(0, i);
  }
  return performance.now() - start;
}

function main() {
  const baseCount = Number(process.argv[2]) || 1000;
  const iterations = Number(process.argv[3]) || 100;

  const benchmarks = [
    {
      name: 'Packed Iteration',
      elics: () => benchPackedElics(baseCount, iterations),
      ecsy: () => benchPackedEcsy(baseCount, iterations),
    },
    {
      name: 'Simple Iteration',
      elics: () => benchSimpleElics(baseCount, iterations),
      ecsy: () => benchSimpleEcsy(baseCount, iterations),
    },
    {
      name: 'Fragmented Iteration',
      elics: () => benchFragmentedElics(iterations),
      ecsy: () => benchFragmentedEcsy(iterations),
    },
    {
      name: 'Entity Cycle',
      elics: () => benchCycleElics(baseCount, iterations),
      ecsy: () => benchCycleEcsy(baseCount, iterations),
    },
    {
      name: 'Add / Remove',
      elics: () => benchAddRemoveElics(baseCount, iterations),
      ecsy: () => benchAddRemoveEcsy(baseCount, iterations),
    },
  ];

  benchmarks.forEach((b) => {
    const elicsTime = b.elics();
    const ecsyTime = b.ecsy();
    console.log(
      `${b.name}\n  EliCS: ${elicsTime.toFixed(2)} ms\n  ecsy: ${ecsyTime.toFixed(2)} ms`
    );
  });
}

main();







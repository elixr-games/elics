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

function createElicsNumberComponent() {
  return createComponent({ value: { type: Types.Number, default: 0 } });
}

function createEcsyNumberComponent(name) {
  class Comp extends EcsyComponent {}
  Comp.schema = { value: { type: EcsyTypes.Number, default: 0 } };
  Object.defineProperty(Comp, 'name', { value: name });
  return Comp;
}

function benchPackedIterationElics(iterations) {
  const world = new EliWorld();
  const comps = 'ABCDE'.split('').reduce((acc, c) => {
    acc[c] = createElicsNumberComponent();
    world.registerComponent(acc[c]);
    return acc;
  }, {});
  const systems = Object.values(comps).map((comp) =>
    class extends createSystem({ items: { required: [comp] } }) {
      update() {
        for (const e of this.queries.items.entities) {
          const v = e.getValue(comp, 'value');
          e.setValue(comp, 'value', v * 2);
        }
      }
    },
  );
  systems.forEach((Sys) => world.registerSystem(Sys));
  for (let i = 0; i < 1000; i++) {
    const ent = world.createEntity();
    for (const comp of Object.values(comps)) ent.addComponent(comp);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.update(0, i);
  return performance.now() - start;
}

function benchPackedIterationEcsy(iterations) {
  const world = new EcsyWorld();
  const comps = 'ABCDE'.split('').reduce((acc, c) => {
    acc[c] = createEcsyNumberComponent(c);
    world.registerComponent(acc[c]);
    return acc;
  }, {});
  const systems = Object.values(comps).map((comp) => {
    class Sys extends EcsySystem {
      execute() {
        this.queries.items.results.forEach((e) => {
          e.getMutableComponent(comp).value *= 2;
        });
      }
    }
    Sys.queries = { items: { components: [comp] } };
    return Sys;
  });
  systems.forEach((Sys) => world.registerSystem(Sys));
  for (let i = 0; i < 1000; i++) {
    const ent = world.createEntity();
    for (const comp of Object.values(comps)) ent.addComponent(comp);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.execute(0);
  return performance.now() - start;
}

function benchSimpleIterationElics(iterations) {
  const world = new EliWorld();
  const A = createElicsNumberComponent();
  const B = createElicsNumberComponent();
  const C = createElicsNumberComponent();
  const D = createElicsNumberComponent();
  const E = createElicsNumberComponent();
  [A, B, C, D, E].forEach((c) => world.registerComponent(c));
  class AB extends createSystem({ items: { required: [A, B] } }) {
    update() {
      for (const e of this.queries.items.entities) {
        const a = e.getValue(A, 'value');
        const b = e.getValue(B, 'value');
        e.setValue(A, 'value', b);
        e.setValue(B, 'value', a);
      }
    }
  }
  class CD extends createSystem({ items: { required: [C, D] } }) {
    update() {
      for (const e of this.queries.items.entities) {
        const c = e.getValue(C, 'value');
        const d = e.getValue(D, 'value');
        e.setValue(C, 'value', d);
        e.setValue(D, 'value', c);
      }
    }
  }
  class CE extends createSystem({ items: { required: [C, E] } }) {
    update() {
      for (const e of this.queries.items.entities) {
        const c = e.getValue(C, 'value');
        const v = e.getValue(E, 'value');
        e.setValue(C, 'value', v);
        e.setValue(E, 'value', c);
      }
    }
  }
  world.registerSystem(AB).registerSystem(CD).registerSystem(CE);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A).addComponent(B);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(D);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(E);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.update(0, i);
  return performance.now() - start;
}

function benchSimpleIterationEcsy(iterations) {
  const world = new EcsyWorld();
  const make = createEcsyNumberComponent;
  const A = make('A');
  const B = make('B');
  const C = make('C');
  const D = make('D');
  const E = make('E');
  [A, B, C, D, E].forEach((c) => world.registerComponent(c));
  class AB extends EcsySystem {
    execute() {
      this.queries.items.results.forEach((e) => {
        const a = e.getMutableComponent(A);
        const b = e.getMutableComponent(B);
        const t = a.value;
        a.value = b.value;
        b.value = t;
      });
    }
  }
  AB.queries = { items: { components: [A, B] } };
  class CD extends EcsySystem {
    execute() {
      this.queries.items.results.forEach((e) => {
        const c = e.getMutableComponent(C);
        const d = e.getMutableComponent(D);
        const t = c.value;
        c.value = d.value;
        d.value = t;
      });
    }
  }
  CD.queries = { items: { components: [C, D] } };
  class CE extends EcsySystem {
    execute() {
      this.queries.items.results.forEach((e) => {
        const c = e.getMutableComponent(C);
        const v = e.getMutableComponent(E);
        const t = c.value;
        c.value = v.value;
        v.value = t;
      });
    }
  }
  CE.queries = { items: { components: [C, E] } };
  world.registerSystem(AB).registerSystem(CD).registerSystem(CE);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A).addComponent(B);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(D);
    world.createEntity().addComponent(A).addComponent(B).addComponent(C).addComponent(E);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.execute(0);
  return performance.now() - start;
}

function benchFragmentedIterationElics(iterations) {
  const world = new EliWorld();
  const Data = createElicsNumberComponent();
  world.registerComponent(Data);
  const letters = {};
  for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    letters[char] = createElicsNumberComponent();
    world.registerComponent(letters[char]);
  }
  class DataSystem extends createSystem({ items: { required: [Data] } }) {
    update() {
      for (const e of this.queries.items.entities) {
        const v = e.getValue(Data, 'value');
        e.setValue(Data, 'value', v * 2);
      }
    }
  }
  class ZSystem extends createSystem({ items: { required: [letters.Z] } }) {
    update() {
      for (const e of this.queries.items.entities) {
        const v = e.getValue(letters.Z, 'value');
        e.setValue(letters.Z, 'value', v * 2);
      }
    }
  }
  world.registerSystem(DataSystem).registerSystem(ZSystem);
  for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    for (let i = 0; i < 100; i++) {
      world.createEntity().addComponent(letters[char]).addComponent(Data);
    }
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.update(0, i);
  return performance.now() - start;
}

function benchFragmentedIterationEcsy(iterations) {
  const world = new EcsyWorld();
  const Data = createEcsyNumberComponent('Data');
  world.registerComponent(Data);
  const letters = {};
  for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    letters[char] = createEcsyNumberComponent(char);
    world.registerComponent(letters[char]);
  }
  class DataSystem extends EcsySystem {
    execute() {
      this.queries.items.results.forEach((e) => {
        e.getMutableComponent(Data).value *= 2;
      });
    }
  }
  DataSystem.queries = { items: { components: [Data] } };
  class ZSystem extends EcsySystem {
    execute() {
      this.queries.items.results.forEach((e) => {
        e.getMutableComponent(letters.Z).value *= 2;
      });
    }
  }
  ZSystem.queries = { items: { components: [letters.Z] } };
  world.registerSystem(DataSystem).registerSystem(ZSystem);
  for (const char of 'ABCDEFGHIJKLMNOPQRSTUVWXYZ') {
    for (let i = 0; i < 100; i++) {
      world.createEntity().addComponent(letters[char]).addComponent(Data);
    }
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.execute(0);
  return performance.now() - start;
}

function benchEntityCycleElics(iterations) {
  const world = new EliWorld();
  const A = createElicsNumberComponent();
  const B = createElicsNumberComponent();
  world.registerComponent(A).registerComponent(B);
  class CycleSystem extends createSystem({ as: { required: [A] }, bs: { required: [B] } }) {
    update() {
      for (const _ of this.queries.as.entities) {
        world.createEntity().addComponent(B);
      }
      for (const e of this.queries.bs.entities) {
        e.destroy();
      }
    }
  }
  world.registerSystem(CycleSystem);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.update(0, i);
  return performance.now() - start;
}

function benchEntityCycleEcsy(iterations) {
  const world = new EcsyWorld();
  const A = createEcsyNumberComponent('A');
  const B = createEcsyNumberComponent('B');
  world.registerComponent(A).registerComponent(B);
  class CycleSystem extends EcsySystem {
    execute() {
      this.queries.as.results.forEach(() => {
        world.createEntity().addComponent(B);
      });
      this.queries.bs.results.forEach((e) => {
        e.remove();
      });
    }
  }
  CycleSystem.queries = { as: { components: [A] }, bs: { components: [B] } };
  world.registerSystem(CycleSystem);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.execute(0);
  return performance.now() - start;
}

function benchAddRemoveElics(iterations) {
  const world = new EliWorld();
  const A = createElicsNumberComponent();
  const B = createElicsNumberComponent();
  world.registerComponent(A).registerComponent(B);
  class AddRemoveSystem extends createSystem({ as: { required: [A] }, bs: { required: [B] } }) {
    update() {
      for (const e of this.queries.as.entities) {
        if (!e.hasComponent(B)) e.addComponent(B);
      }
      for (const e of this.queries.bs.entities) {
        e.removeComponent(B);
      }
    }
  }
  world.registerSystem(AddRemoveSystem);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.update(0, i);
  return performance.now() - start;
}


function benchAddRemoveEcsy(iterations) {
  const world = new EcsyWorld();
  const A = createEcsyNumberComponent('A');
  const B = createEcsyNumberComponent('B');
  world.registerComponent(A).registerComponent(B);
  class AddRemoveSystem extends EcsySystem {
    execute() {
      this.queries.as.results.forEach((e) => {
        if (!e.hasComponent(B)) e.addComponent(B);
      });
      this.queries.bs.results.forEach((e) => {
        e.removeComponent(B);
      });
    }
  }
  AddRemoveSystem.queries = { as: { components: [A] }, bs: { components: [B] } };
  world.registerSystem(AddRemoveSystem);
  for (let i = 0; i < 1000; i++) {
    world.createEntity().addComponent(A);
  }
  const start = performance.now();
  for (let i = 0; i < iterations; i++) world.execute(0);
  return performance.now() - start;
}

function main() {
  const iterations = Number(process.argv[2]) || 100;
  const tests = [
    { name: 'Packed Iteration', elics: benchPackedIterationElics, ecsy: benchPackedIterationEcsy },
    { name: 'Simple Iteration', elics: benchSimpleIterationElics, ecsy: benchSimpleIterationEcsy },
    { name: 'Fragmented Iteration', elics: benchFragmentedIterationElics, ecsy: benchFragmentedIterationEcsy },
    { name: 'Entity Cycle', elics: benchEntityCycleElics, ecsy: benchEntityCycleEcsy },
    { name: 'Add / Remove', elics: benchAddRemoveElics, ecsy: benchAddRemoveEcsy },
  ];
  tests.forEach((t) => {
    const e1 = t.elics(iterations);
    const e2 = t.ecsy(iterations);
    console.log(`${t.name}\n  EliCS: ${e1.toFixed(2)} ms\n  ecsy:  ${e2.toFixed(2)} ms`);
  });
}

main();

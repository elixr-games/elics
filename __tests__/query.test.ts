import BitSet from '../src/bit-set';
import { Query } from '../src/query';
import { World } from '../src/world';
import { createComponent } from '../src/component';
import { Types } from '../src/types';
import { eq, ge, gt, isin, le, lt, ne, nin } from '../src/query-helpers';
// no built-in Name helper; predicates operate directly on component fields

// Define components for testing
const PositionComponent = createComponent('Position', {
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const VelocityComponent = createComponent('Velocity', {
	velocity: { type: Types.Vec2, default: [0, 0] },
});

const HealthComponent = createComponent('Health', {
	value: { type: Types.Int16, default: 100 },
});

const SimpleComponent = createComponent('Simple', {
	value: { type: Types.Int8, default: 0 },
});

describe('Query Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);
	});

	test('Querying entities with required components', () => {
		const queryConfig = {
			required: [PositionComponent, VelocityComponent],
		};
		const query = world.queryManager.registerQuery(queryConfig);

		const entity1 = world.createEntity();
		entity1.addComponent(PositionComponent);
		entity1.addComponent(VelocityComponent);

		const entity2 = world.createEntity();
		entity2.addComponent(PositionComponent);

		expect(query.entities).toContain(entity1);
		expect(query.entities).not.toContain(entity2);
	});

	test('Querying entities with excluded components', () => {
		const queryConfig = {
			required: [PositionComponent],
			excluded: [HealthComponent],
		};
		const query = world.queryManager.registerQuery(queryConfig);

		const entity1 = world.createEntity();
		entity1.addComponent(PositionComponent);

		const entity2 = world.createEntity();
		entity2.addComponent(PositionComponent);
		entity2.addComponent(HealthComponent);

		expect(query.entities).toContain(entity1);
		expect(query.entities).not.toContain(entity2);
	});

	test('Querying entities with both required and excluded components', () => {
		const queryConfig = {
			required: [PositionComponent],
			excluded: [VelocityComponent],
		};
		const query = world.queryManager.registerQuery(queryConfig);

		const entity1 = world.createEntity();
		entity1.addComponent(PositionComponent);
		entity1.addComponent(VelocityComponent);

		const entity2 = world.createEntity();
		entity2.addComponent(PositionComponent);
		entity2.addComponent(HealthComponent);

		expect(query.entities).toContain(entity2);
		expect(query.entities).not.toContain(entity1);
	});

	test('Multiple queries with overlapping components', () => {
		const queryConfig1 = {
			required: [PositionComponent, HealthComponent],
		};

		const queryConfig2 = {
			required: [VelocityComponent, HealthComponent],
		};

		const query1 = world.queryManager.registerQuery(queryConfig1);
		const query2 = world.queryManager.registerQuery(queryConfig2);

		const entity1 = world.createEntity();
		entity1.addComponent(PositionComponent);
		entity1.addComponent(HealthComponent);

		const entity2 = world.createEntity();
		entity2.addComponent(VelocityComponent);
		entity2.addComponent(HealthComponent);

		expect(query1.entities).toContain(entity1);
		expect(query1.entities).not.toContain(entity2);

		expect(query2.entities).toContain(entity2);
		expect(query2.entities).not.toContain(entity1);
	});

	test('Removing components affects query results', () => {
		const queryConfig = {
			required: [PositionComponent, VelocityComponent],
		};
		const query = world.queryManager.registerQuery(queryConfig);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);

		expect(query.entities).toContain(entity);

		// Remove a component
		entity.removeComponent(VelocityComponent);

		expect(query.entities).not.toContain(entity);
	});

	test('Entity removal from all queries when last component removed', () => {
		world.registerComponent(SimpleComponent);
		const query = world.queryManager.registerQuery({
			required: [SimpleComponent],
		});
		const entity = world.createEntity();
		entity.addComponent(SimpleComponent);
		expect(query.entities).toContain(entity);
		entity.removeComponent(SimpleComponent);
		expect(query.entities).not.toContain(entity);
	});

	test('Entity destroy cleans up query results', () => {
		world.registerComponent(SimpleComponent);
		const query = world.queryManager.registerQuery({
			required: [SimpleComponent],
		});
		const entity = world.createEntity();
		entity.addComponent(SimpleComponent);
		expect(query.entities).toContain(entity);
		entity.destroy();
		expect(query.entities).not.toContain(entity);
	});

	test('Entity destroy with multiple components cleans queries', () => {
		const q1 = world.queryManager.registerQuery({
			required: [PositionComponent],
		});
		const q2 = world.queryManager.registerQuery({
			required: [VelocityComponent],
		});
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);
		expect(q1.entities).toContain(entity);
		expect(q2.entities).toContain(entity);
		entity.destroy();
		expect(q1.entities).not.toContain(entity);
		expect(q2.entities).not.toContain(entity);
	});

	test('resetEntity removes entity from relevant queries', () => {
		const q1 = world.queryManager.registerQuery({
			required: [PositionComponent],
		});
		const q2 = world.queryManager.registerQuery({
			required: [VelocityComponent],
		});
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);
		expect(q1.entities).toContain(entity);
		expect(q2.entities).toContain(entity);
		world.queryManager.resetEntity(entity);
		expect(q1.entities).not.toContain(entity);
		expect(q2.entities).not.toContain(entity);
	});

	test('resetEntity triggers disqualify subscribers', () => {
		const q1 = world.queryManager.registerQuery({
			required: [PositionComponent],
		});
		const q2 = world.queryManager.registerQuery({
			required: [VelocityComponent],
		});

		const disqualifyCallback1 = jest.fn();
		const disqualifyCallback2 = jest.fn();

		q1.subscribe('disqualify', disqualifyCallback1);
		q2.subscribe('disqualify', disqualifyCallback2);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);

		expect(q1.entities).toContain(entity);
		expect(q2.entities).toContain(entity);

		world.queryManager.resetEntity(entity);

		expect(disqualifyCallback1).toHaveBeenCalledWith(entity);
		expect(disqualifyCallback2).toHaveBeenCalledWith(entity);
		expect(disqualifyCallback1).toHaveBeenCalledTimes(1);
		expect(disqualifyCallback2).toHaveBeenCalledTimes(1);
	});

	test('resetEntity handles components with no queries and avoids duplicate notifications', () => {
		const A = createComponent('A_only', {
			x: { type: Types.Int8, default: 0 },
		});
		const B = createComponent('B_only', {
			y: { type: Types.Int8, default: 0 },
		});
		world.registerComponent(A).registerComponent(B);
		// Register a query that watches both A and B
		const q = world.queryManager.registerQuery({ required: [A, B] });
		const disq = jest.fn();
		q.subscribe('disqualify', disq);
		const e = world.createEntity();
		e.addComponent(A).addComponent(B);
		expect(q.entities).toContain(e);
		// Add a component that no query cares about
		const C = createComponent('C_unused', {
			z: { type: Types.Int8, default: 0 },
		});
		world.registerComponent(C);
		e.addComponent(C);
		// Now resetEntity; should disqualify once (processed set prevents duplicates)
		world.queryManager.resetEntity(e);
		expect(disq).toHaveBeenCalledTimes(1);
	});

	test('Query subscribers run as expected', () => {
		const queryConfig = {
			required: [PositionComponent, VelocityComponent],
		};
		const query = world.queryManager.registerQuery(queryConfig);
		const qualifyCallback = jest.fn();
		const unsubQualify = query.subscribe('qualify', qualifyCallback);
		const disqualifyCallback = jest.fn();
		query.subscribe('disqualify', disqualifyCallback);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);
		expect(qualifyCallback).toHaveBeenCalledTimes(1);

		// Remove a component which disqualifies entity from query
		entity.removeComponent(VelocityComponent);
		expect(disqualifyCallback).toHaveBeenCalledTimes(1);

		// unsubscribe from qualify, callback no longer called when entity qualifies
		unsubQualify();
		entity.addComponent(VelocityComponent);
		expect(qualifyCallback).toHaveBeenCalledTimes(1);
	});

	test('Disqualify subscribers trigger on entity destroy', () => {
		const query = world.queryManager.registerQuery({
			required: [PositionComponent],
		});
		const disqualifyCallback = jest.fn();
		query.subscribe('disqualify', disqualifyCallback);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent);

		// Destroying should trigger disqualify
		entity.destroy();

		expect(disqualifyCallback).toHaveBeenCalledTimes(1);
	});

	test('Registering the same query multiple times', () => {
		const queryConfig = {
			required: [PositionComponent],
		};

		world.registerQuery(queryConfig);
		const query1 = world.queryManager.registerQuery(queryConfig);
		const query2 = world.queryManager.registerQuery(queryConfig);

		expect(query1).toBe(query2);
	});

	test('Registering query with unregistered component auto-registers it', () => {
		const UnregisteredComponent = createComponent('Unregistered', {
			value: { type: Types.Int16, default: 0 },
		});

		// Component should not be registered initially
		expect(world.hasComponent(UnregisteredComponent)).toBe(false);

		const queryConfig = {
			required: [UnregisteredComponent],
		};

		// Should not throw and should auto-register the component
		const query = world.queryManager.registerQuery(queryConfig);
		expect(query).toBeDefined();
		expect(world.hasComponent(UnregisteredComponent)).toBe(true);
	});

	test('Registering query with unregistered excluded component auto-registers it', () => {
		const UnregisteredRequiredComponent = createComponent(
			'UnregisteredRequired',
			{
				value: { type: Types.Int16, default: 0 },
			},
		);
		const UnregisteredExcludedComponent = createComponent(
			'UnregisteredExcluded',
			{
				flag: { type: Types.Boolean, default: false },
			},
		);

		// Components should not be registered initially
		expect(world.hasComponent(UnregisteredRequiredComponent)).toBe(false);
		expect(world.hasComponent(UnregisteredExcludedComponent)).toBe(false);

		const queryConfig = {
			required: [UnregisteredRequiredComponent],
			excluded: [UnregisteredExcludedComponent],
		};

		// Should not throw and should auto-register both components
		const query = world.queryManager.registerQuery(queryConfig);
		expect(query).toBeDefined();
		expect(world.hasComponent(UnregisteredRequiredComponent)).toBe(true);
		expect(world.hasComponent(UnregisteredExcludedComponent)).toBe(true);
	});

	test('Query results from unregistered query', () => {
		const world = new World({ checksOn: false });
		world.registerComponent(PositionComponent);
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);

		expect(
			new Query(PositionComponent.bitmask!, new BitSet(), '').entities,
		).toEqual(new Set());
	});

	test('Newly registered query finds existing entities', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);

		const queryConfig = {
			required: [PositionComponent],
		};

		const query = world.queryManager.registerQuery(queryConfig);
		expect(query.entities).toContain(entity);
	});

	test('Query with excluded components filters correctly', () => {
		const entity1 = world.createEntity();
		const entity2 = world.createEntity();

		entity1.addComponent(PositionComponent);
		entity2.addComponent(PositionComponent);
		entity2.addComponent(VelocityComponent);

		const queryConfig = {
			required: [PositionComponent],
			excluded: [VelocityComponent],
		};

		const query = world.queryManager.registerQuery(queryConfig);

		// entity1 should match (has Position, no Velocity)
		expect(query.entities).toContain(entity1);
		// entity2 should not match (has Position but also has excluded Velocity)
		expect(query.entities).not.toContain(entity2);
	});

	test('Query matching with excluded components returns false correctly', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);

		const queryConfig = {
			required: [PositionComponent],
			excluded: [VelocityComponent],
		};

		const query = world.queryManager.registerQuery(queryConfig);

		// Direct test of matches method to cover the excluded branch
		expect(query.matches(entity)).toBe(false);
	});

	test('UpdateEntity without changedComponent parameter', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);

		const queryConfig = {
			required: [PositionComponent],
		};

		const query = world.queryManager.registerQuery(queryConfig);

		// Remove entity from query first
		query.entities.delete(entity);
		expect(query.entities).not.toContain(entity);

		// Call updateEntity without changedComponent to test all-queries path
		world.queryManager.updateEntity(entity);

		// Entity should be back in the query
		expect(query.entities).toContain(entity);
	});

	test('Query with value predicate matches specific entity and reacts to changes', () => {
		const localWorld = new World({ checksOn: false });
		const Panel = createComponent('Panel', {
			id: { type: Types.String, default: '' },
		});
		localWorld.registerComponent(Panel);
		const e1 = localWorld.createEntity().addComponent(Panel, { id: 'panel1' });
		const e2 = localWorld.createEntity().addComponent(Panel, { id: 'panel2' });
		localWorld.createEntity().addComponent(Panel, { id: 'panel3' });

		const qSpecific = localWorld.queryManager.registerQuery({
			required: [Panel],
			where: [eq(Panel, 'id', 'panel2')],
		});
		expect(qSpecific.entities.size).toBe(1);
		expect([...qSpecific.entities][0]).toBe(e2);

		// Change e1 to match, expect it to qualify (value-path only)
		const qualify = jest.fn();
		qSpecific.subscribe('qualify', qualify);
		e1.setValue(Panel, 'id', 'panel2');
		expect(qualify).toHaveBeenCalledWith(e1);
		expect(qSpecific.entities).toContain(e1);

		// Additional numeric predicate checks on a simple numeric component
		const Num = createComponent('Num', {
			v: { type: Types.Float32, default: 0 },
		});
		localWorld.registerComponent(Num);
		const n1 = localWorld.createEntity().addComponent(Num, { v: 10 });
		const n2 = localWorld.createEntity().addComponent(Num, { v: 5 });
		const qGt = localWorld.queryManager.registerQuery({
			required: [Num],
			where: [{ component: Num, key: 'v', op: 'gt', value: 7 }],
		});
		expect(qGt.entities.has(n1)).toBe(true);
		expect(qGt.entities.has(n2)).toBe(false);
		// Update value to cross boundary and trigger qualify
		const qLe = localWorld.queryManager.registerQuery({
			required: [Num],
			where: [{ component: Num, key: 'v', op: 'le', value: 5 }],
		});

		const qLeQualify = jest.fn();
		qLe.subscribe('qualify', qLeQualify);
		n1.setValue(Num, 'v', 5);
		expect(qLeQualify).toHaveBeenCalledWith(n1);
		// ge: create query, then raise value to trigger qualify
		const qGe = localWorld.queryManager.registerQuery({
			required: [Num],
			where: [{ component: Num, key: 'v', op: 'ge', value: 10 }],
		});
		const geQualify = jest.fn();
		qGe.subscribe('qualify', geQualify);
		expect(qGe.entities.has(n1)).toBe(false);
		n1.setValue(Num, 'v', 10);
		expect(geQualify).toHaveBeenCalledWith(n1);
		expect(qGe.entities.has(n1)).toBe(true);
	});
});

test('Value predicates support ne and in/nin and validate errors', () => {
	const w = new World({ checksOn: false });
	const Panel = createComponent('P2', {
		id: { type: Types.String, default: '' },
	});
	const Tag = createComponent('Tag', {
		t: { type: Types.String, default: '' },
	});
	w.registerComponent(Panel).registerComponent(Tag);
	const a = w
		.createEntity()
		.addComponent(Panel, { id: 'panel1' })
		.addComponent(Tag, { t: 'a' });
	const b = w
		.createEntity()
		.addComponent(Panel, { id: 'panel2' })
		.addComponent(Tag, { t: 'b' });
	const c = w
		.createEntity()
		.addComponent(Panel, { id: 'panel3' })
		.addComponent(Tag, { t: 'c' });

	// ne
	const qNe = w.queryManager.registerQuery({
		required: [Panel],
		where: [ne(Panel, 'id', 'panel2')],
	});
	expect(qNe.entities.has(b)).toBe(false);
	expect(qNe.entities.has(a)).toBe(true);
	expect(qNe.entities.has(c)).toBe(true);

	// in
	const qIn = w.queryManager.registerQuery({
		required: [Tag],
		where: [isin(Tag, 't', ['a', 'x'])],
	});
	expect(qIn.entities.has(a)).toBe(true);
	expect(qIn.entities.has(b)).toBe(false);
	// nin
	const qNin = w.queryManager.registerQuery({
		required: [Tag],
		where: [{ component: Tag, key: 't', op: 'nin', value: ['b'] }],
	});
	expect(qNin.entities.has(a)).toBe(true);
	expect(qNin.entities.has(b)).toBe(false);
	// update value triggers re-eval on nin
	const disq = jest.fn();
	qNin.subscribe('disqualify', disq);
	a.setValue(Tag, 't', 'b');
	expect(disq).toHaveBeenCalledWith(a);
	expect(qNin.entities.has(a)).toBe(false);

	// validation: bad key
	expect(() =>
		w.queryManager.registerQuery({
			required: [Panel],
			where: [
				{ component: Panel, key: 'missing', op: 'eq', value: 'x' },
			] as any,
		}),
	).toThrow();
	// validation: invalid op on non-numeric
	expect(() =>
		w.queryManager.registerQuery({
			required: [Panel],
			where: [{ component: Panel, key: 'id', op: 'lt', value: 'x' }] as any,
		}),
	).toThrow();
	// validation: 'in' requires array value
	expect(() =>
		w.queryManager.registerQuery({
			required: [Tag],
			where: [{ component: Tag, key: 't', op: 'in', value: 'x' as any }],
		}),
	).toThrow();
});

test('builder helpers produce correct predicates', () => {
	const w = new World({ checksOn: false });
	const Num = createComponent('NumB', {
		v: { type: Types.Float32, default: 0 },
	});
	w.registerComponent(Num);
	const eA = w.createEntity().addComponent(Num, { v: 1 });
	const eB = w.createEntity().addComponent(Num, { v: 10 });

	const qLt = w.queryManager.registerQuery({
		required: [Num],
		where: [lt(Num, 'v', 5)],
	});
	expect(qLt.entities.has(eA)).toBe(true);
	expect(qLt.entities.has(eB)).toBe(false);

	const qLe = w.queryManager.registerQuery({
		required: [Num],
		where: [le(Num, 'v', 1)],
	});
	expect(qLe.entities.has(eA)).toBe(true);
	expect(qLe.entities.has(eB)).toBe(false);

	const qGt = w.queryManager.registerQuery({
		required: [Num],
		where: [gt(Num, 'v', 5)],
	});
	expect(qGt.entities.has(eA)).toBe(false);
	expect(qGt.entities.has(eB)).toBe(true);

	const qGe = w.queryManager.registerQuery({
		required: [Num],
		where: [ge(Num, 'v', 10)],
	});
	expect(qGe.entities.has(eA)).toBe(false);
	expect(qGe.entities.has(eB)).toBe(true);

	const Str = createComponent('StrB', {
		s: { type: Types.String, default: '' },
	});
	w.registerComponent(Str);
	const s1 = w.createEntity().addComponent(Str, { s: 'x' });
	const s2 = w.createEntity().addComponent(Str, { s: 'y' });
	const qNin = w.queryManager.registerQuery({
		required: [Str],
		where: [nin(Str, 's', ['x'])],
	});
	expect(qNin.entities.has(s1)).toBe(false);
	expect(qNin.entities.has(s2)).toBe(true);
});

test('updateEntityValue early return path when no value-queries exist', () => {
	const w = new World({ checksOn: false });
	const C = createComponent('C_only', { v: { type: Types.Int8, default: 0 } });
	w.registerComponent(C);
	const e = w.createEntity().addComponent(C, { v: 1 });
	// No queries registered that reference C in where
	// Changing value should not throw and should not affect any queries
	expect(() => e.setValue(C, 'v', 2)).not.toThrow();
});

test('Registering query auto-registers unregistered predicate component', () => {
	const w = new World({ checksOn: false });
	const A = createComponent('AutoPredA', {
		x: { type: Types.Int8, default: 0 },
	});
	const Pred = createComponent('AutoPred', {
		k: { type: Types.String, default: '' },
	});
	w.registerComponent(A);
	expect(w.hasComponent(Pred)).toBe(false);
	const q = w.queryManager.registerQuery({
		required: [A],
		where: [eq(Pred, 'k', 'v')],
	});
	expect(q).toBeDefined();
	expect(w.hasComponent(Pred)).toBe(true);
});

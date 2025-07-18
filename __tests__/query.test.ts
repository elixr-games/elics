import BitSet from '../src/bit-set';
import { Query } from '../src/query';
import { World } from '../src/world';
import { createComponent } from '../src/component';
import { Types } from '../src/types';

// Define components for testing
const PositionComponent = createComponent({
	x: { type: Types.Float32, default: 0 },
	y: { type: Types.Float32, default: 0 },
});

const VelocityComponent = createComponent({
	velocity: { type: Types.Vec2, default: [0, 0] },
});

const HealthComponent = createComponent({
	value: { type: Types.Int16, default: 100 },
});

const SimpleComponent = createComponent({
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
		const UnregisteredComponent = createComponent({
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
		const UnregisteredRequiredComponent = createComponent({
			value: { type: Types.Int16, default: 0 },
		});
		const UnregisteredExcludedComponent = createComponent({
			flag: { type: Types.Boolean, default: false },
		});

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
});

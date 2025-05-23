import { World } from '../src/World';
import { createComponent } from '../src/Component';
import { Types } from '../src/Types';

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

const VectorComponent = createComponent({
	position: { type: Types.Vec3, default: [0, 0, 0] },
});

const NameComponent = createComponent({
	name: { type: Types.String, default: '' },
});

const CustomDataComponent = createComponent({
	data: { type: Types.Object, default: null },
});

const BoolComponent = createComponent({
	flag: { type: Types.Boolean, default: false },
});

const ReferenceComponent = createComponent({
	target: { type: Types.Entity, default: null as any },
});

describe('Entity Tests', () => {
	let world: World;

	beforeEach(() => {
		world = new World();
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);
		world.registerComponent(VectorComponent);
		world.registerComponent(NameComponent);
		world.registerComponent(CustomDataComponent);
		world.registerComponent(ReferenceComponent);
		world.registerComponent(BoolComponent);
	});

	test('Entity creation', () => {
		const entity = world.createEntity();
		expect(entity).toBeDefined();
		expect(entity.active).toBe(true);
	});

	test('Adding multiple components at once', () => {
		const entity = world.createEntity();

		entity.addComponent(PositionComponent, { x: 10, y: 20 });
		entity.addComponent(VelocityComponent, { velocity: [5, 5] });

		expect(entity.hasComponent(PositionComponent)).toBe(true);
		expect(entity.hasComponent(VelocityComponent)).toBe(true);

		// Use getValue and getVectorView
		expect(entity.getValue(PositionComponent, 'x')).toBe(10);
		expect(entity.getValue(PositionComponent, 'y')).toBe(20);

		const velocity = entity.getVectorView(VelocityComponent, 'velocity');
		expect(velocity[0]).toBe(5);
		expect(velocity[1]).toBe(5);
	});

	test('Removing components', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		expect(entity.hasComponent(PositionComponent)).toBe(true);

		entity.removeComponent(PositionComponent);
		expect(entity.hasComponent(PositionComponent)).toBe(false);
	});

	test('Getting component by typeId', () => {
		expect(
			world.componentManager.getComponentByTypeId(PositionComponent.typeId),
		).toBe(PositionComponent);
	});

	test('Getting component list', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		entity.addComponent(VelocityComponent);

		const components = entity.getComponents();
		expect(components).toContain(PositionComponent);
		expect(components).toContain(VelocityComponent);
	});

	test('Getting component value with invalid key', () => {
		const entity = world.createEntity();
		entity.addComponent(PositionComponent);
		expect(
			entity.getValue(PositionComponent, 'invalidKey' as any),
		).toBeUndefined();
	});

	test('Entity destruction and reuse', () => {
		const entity = world.createEntity();
		const index = entity.index;
		entity.destroy();

		expect(entity.active).toBe(false);

		// Create a new entity, which should reuse the destroyed one
		const newEntity = world.createEntity();
		expect(newEntity.index).toBe(index);
		expect(newEntity.active).toBe(true);
	});

	test('Modifying destroyed entity throws error', () => {
		const entity = world.createEntity();
		entity.destroy();

		expect(() => entity.addComponent(PositionComponent)).toThrow();
	});

	test('Entity index lookup updates on destroy', () => {
		const entity = world.createEntity();
		const index = entity.index;
		entity.destroy();

		const newEntity = world.createEntity();
		expect(newEntity.index).toBe(index);
		expect(world.entityManager.getEntityByIndex(index)).toBe(newEntity);
	});

	test('getValue handles boolean types', () => {
		const entity = world.createEntity();
		entity.addComponent(BoolComponent);

		expect(entity.getValue(BoolComponent, 'flag')).toBe(false);
		entity.setValue(BoolComponent, 'flag', 1 as any);
		expect(entity.getValue(BoolComponent, 'flag')).toBe(true);
		(BoolComponent.data as any).flag = undefined;
		expect(entity.getValue(BoolComponent, 'flag')).toBe(false);
	});

	test('Vec3 component data access', () => {
		const entity = world.createEntity();
		entity.addComponent(VectorComponent, { position: [1.0, 2.0, 3.0] });

		const position = entity.getVectorView(VectorComponent, 'position');
		const secondView = entity.getVectorView(VectorComponent, 'position');
		expect(secondView).toBe(position);

		expect(position[0]).toBe(1.0);
		expect(position[1]).toBe(2.0);
		expect(position[2]).toBe(3.0);

		// Update component data
		position[0] = 4.0;
		position[1] = 5.0;
		position[2] = 6.0;

		expect(position[0]).toBe(4.0);
		expect(position[1]).toBe(5.0);
		expect(position[2]).toBe(6.0);
	});

	test('String component data access', () => {
		const entity = world.createEntity();
		entity.addComponent(NameComponent, { name: 'TestEntity' });

		expect(entity.getValue(NameComponent, 'name')).toBe('TestEntity');

		// Update component data
		entity.setValue(NameComponent, 'name', 'UpdatedEntity');

		expect(entity.getValue(NameComponent, 'name')).toBe('UpdatedEntity');
	});

	test('Object component data access', () => {
		const entity = world.createEntity();
		const initialData = { key: 'value' };
		entity.addComponent(CustomDataComponent, { data: initialData });

		expect(entity.getValue(CustomDataComponent, 'data')).toEqual(initialData);

		// Update component data
		const newData = { newKey: 'newValue' };
		entity.setValue(CustomDataComponent, 'data', newData);

		expect(entity.getValue(CustomDataComponent, 'data')).toEqual(newData);
	});

	test('Entity reference component data access', () => {
		const e1 = world.createEntity();
		const e2 = world.createEntity();
		e1.addComponent(ReferenceComponent, { target: e2 });

		expect(e1.getValue(ReferenceComponent, 'target')).toBe(e2);

		const e3 = world.createEntity();
		e1.setValue(ReferenceComponent, 'target', e3);

		expect(e1.getValue(ReferenceComponent, 'target')).toBe(e3);
		expect(ReferenceComponent.data.target[e1.index]).toBe(e3.index);
	});

	test('Entity reference default value', () => {
		const e = world.createEntity();
		e.addComponent(ReferenceComponent);
		expect(e.getValue(ReferenceComponent, 'target')).toBeUndefined();
		expect(ReferenceComponent.data.target[e.index]).toBe(-1);
	});

	test('entity references work beyond Int16 range', () => {
		const world = new World({ entityCapacity: 33000 });
		const RefComp = createComponent({
			ref: { type: Types.Entity, default: null as any },
		});
		world.registerComponent(RefComp);

		// create a bunch of entities to exceed 32767 index
		let last: any = null;
		for (let i = 0; i < 33000; i++) {
			last = world.createEntity();
		}

		last.addComponent(RefComp, { ref: last });
		expect(last.getValue(RefComp, 'ref')).toBe(last);
	});
});

import { World } from '../src/world';
import { createComponent } from '../src/component';
import { createSystem } from '../src/system';
import { Types } from '../src/types';

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

const VectorComponent = createComponent('Vector', {
	position: { type: Types.Vec3, default: [0, 0, 0] },
});

// Define systems for testing
class MovementSystem extends createSystem({
	movingEntities: {
		required: [PositionComponent, VelocityComponent],
	},
}) {
	init(): void {}

	update(delta: number): void {
		for (const entity of this.queries.movingEntities.entities) {
			// Use getValue and getVectorView methods
			const posX = entity.getValue(PositionComponent, 'x')!;
			const posY = entity.getValue(PositionComponent, 'y')!;

			const velocity = entity.getVectorView(VelocityComponent, 'velocity');

			// Update positions
			entity.setValue(PositionComponent, 'x', posX + velocity[0] * delta);
			entity.setValue(PositionComponent, 'y', posY + velocity[1] * delta);
		}
	}
}

class HealthSystem extends createSystem(
	{
		entitiesWithHealth: {
			required: [HealthComponent],
		},
	},
	{
		healthDecreaseRate: { type: Types.Int16, default: 10 },
	},
) {
	update(delta: number): void {
		for (const entity of this.queries.entitiesWithHealth.entities) {
			const healthValue: number = entity.getValue(HealthComponent, 'value')!;
			entity.setValue(
				HealthComponent,
				'value',
				healthValue - (this.config.healthDecreaseRate.value as number) * delta,
			);
		}
	}
}

describe('EliCS Integration Tests', () => {
	test('Integration test with multiple systems and components', () => {
		const world = new World({
			checksOn: false,
		});
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);
		world.registerComponent(HealthComponent);
		world.registerComponent(VectorComponent);

		world.registerSystem(MovementSystem);
		world.registerSystem(HealthSystem);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent, { x: 0, y: 0 });
		entity.addComponent(VelocityComponent, { velocity: [2, 3] });
		entity.addComponent(HealthComponent);

		// Include Vec3 testing
		const entity2 = world.createEntity();
		entity2.addComponent(VectorComponent, { position: [1.0, 1.0, 1.0] });
		entity2.addComponent(VelocityComponent, { velocity: [1.0, 1.0] });

		// Initial state
		expect(entity.getValue(PositionComponent, 'x')).toBe(0);
		expect(entity.getValue(PositionComponent, 'y')).toBe(0);
		expect(entity.getValue(HealthComponent, 'value')).toBe(100);

		const positionVec3 = entity2.getVectorView(VectorComponent, 'position');
		expect(positionVec3[0]).toBe(1.0);
		expect(positionVec3[1]).toBe(1.0);
		expect(positionVec3[2]).toBe(1.0);

		// First update
		world.update(1, 1); // delta = 1
		expect(entity.getValue(PositionComponent, 'x')).toBe(2);
		expect(entity.getValue(PositionComponent, 'y')).toBe(3);
		expect(entity.getValue(HealthComponent, 'value')).toBe(90);

		// Update Vec3 position manually
		const velocityVec2 = entity2.getVectorView(VelocityComponent, 'velocity');
		positionVec3[0] += velocityVec2[0] * 1; // delta = 1
		positionVec3[1] += velocityVec2[1] * 1;
		// z remains the same
		expect(positionVec3[0]).toBe(2.0);
		expect(positionVec3[1]).toBe(2.0);
		expect(positionVec3[2]).toBe(1.0);

		// Second update
		world.update(1, 1); // delta = 1
		expect(entity.getValue(PositionComponent, 'x')).toBe(4);
		expect(entity.getValue(PositionComponent, 'y')).toBe(6);
		expect(entity.getValue(HealthComponent, 'value')).toBe(80);

		// Update Vec3 position again
		positionVec3[0] += velocityVec2[0] * 1;
		positionVec3[1] += velocityVec2[1] * 1;
		expect(positionVec3[0]).toBe(3.0);
		expect(positionVec3[1]).toBe(3.0);
		expect(positionVec3[2]).toBe(1.0);

		// Remove HealthComponent
		entity.removeComponent(HealthComponent);

		// Third update
		world.update(1, 1); // delta = 1
		expect(entity.getValue(PositionComponent, 'x')).toBe(6);
		expect(entity.getValue(PositionComponent, 'y')).toBe(9);
		// Health should remain the same since HealthComponent was removed
		expect(entity.getValue(HealthComponent, 'value')).toBe(80); // No further decrease

		// Update Vec3 position again
		positionVec3[0] += velocityVec2[0] * 1;
		positionVec3[1] += velocityVec2[1] * 1;
		expect(positionVec3[0]).toBe(4.0);
		expect(positionVec3[1]).toBe(4.0);
		expect(positionVec3[2]).toBe(1.0);
	});

	test('entityReleaseCallback is called when entity is released', () => {
		const releasedEntities: number[] = [];
		const releaseCallback = jest.fn((entity) => {
			releasedEntities.push(entity.index);
		});

		const world = new World({
			checksOn: false,
			entityReleaseCallback: releaseCallback,
		});

		world.registerComponent(PositionComponent);

		// Create and configure entities
		const entity1 = world.createEntity();
		entity1.addComponent(PositionComponent, { x: 10, y: 20 });

		const entity2 = world.createEntity();
		entity2.addComponent(PositionComponent, { x: 30, y: 40 });

		// Store entity indices for verification
		const entity1Index = entity1.index;
		const entity2Index = entity2.index;

		// Release first entity
		entity1.destroy();

		// Verify callback was called for entity1
		expect(releaseCallback).toHaveBeenCalledTimes(1);
		expect(releaseCallback).toHaveBeenCalledWith(entity1);
		expect(releasedEntities).toContain(entity1Index);

		// Release second entity
		entity2.destroy();

		// Verify callback was called for entity2
		expect(releaseCallback).toHaveBeenCalledTimes(2);
		expect(releaseCallback).toHaveBeenCalledWith(entity2);
		expect(releasedEntities).toContain(entity2Index);
		expect(releasedEntities).toEqual([entity1Index, entity2Index]);
	});

	test('entityReleaseCallback is optional and world works without it', () => {
		const world = new World({
			checksOn: false,
			// No entityReleaseCallback provided
		});

		world.registerComponent(PositionComponent);

		const entity = world.createEntity();
		entity.addComponent(PositionComponent, { x: 10, y: 20 });

		// Should not throw when releasing entity without callback
		expect(() => {
			entity.destroy();
		}).not.toThrow();
	});

	test('Rapid create/destroy cycles maintain query consistency', () => {
		// Use large enough capacity for the test
		const world = new World({ entityCapacity: 600, checksOn: false });
		world.registerComponent(PositionComponent);
		world.registerComponent(VelocityComponent);

		const query = world.queryManager.registerQuery({
			required: [PositionComponent, VelocityComponent],
		});

		const qualifyCount = { value: 0 };
		const disqualifyCount = { value: 0 };

		query.subscribe('qualify', () => qualifyCount.value++);
		query.subscribe('disqualify', () => disqualifyCount.value++);

		const activeEntities: any[] = [];

		// Rapid create/destroy cycles
		for (let i = 0; i < 500; i++) {
			const entity = world.createEntity();
			entity.addComponent(PositionComponent, { x: i, y: i });
			entity.addComponent(VelocityComponent, { velocity: [1, 1] });
			activeEntities.push(entity);

			// Randomly destroy some entities
			if (Math.random() > 0.7 && activeEntities.length > 0) {
				const idx = Math.floor(Math.random() * activeEntities.length);
				activeEntities[idx].destroy();
				activeEntities.splice(idx, 1);
			}
		}

		// Query should contain exactly the active entities
		expect(query.entities.size).toBe(activeEntities.length);
		for (const e of activeEntities) {
			expect(query.entities.has(e)).toBe(true);
		}

		// Callbacks should be balanced
		expect(qualifyCount.value - disqualifyCount.value).toBe(
			activeEntities.length,
		);
	});

	test('Entity pool correctly reuses destroyed entities', () => {
		const world = new World({ entityCapacity: 10, checksOn: false });
		world.registerComponent(PositionComponent);

		// Create entities and track their objects
		const entities: any[] = [];
		for (let i = 0; i < 5; i++) {
			const e = world.createEntity();
			e.addComponent(PositionComponent, { x: i * 10, y: i * 10 });
			entities.push(e);
		}

		// Store original indices
		const originalIndices = entities.map((e) => e.index);

		// Destroy all entities
		for (const e of entities) {
			e.destroy();
		}

		// Create new entities - should reuse the pooled entity objects
		const reusedEntities: any[] = [];
		for (let i = 0; i < 5; i++) {
			const e = world.createEntity();
			reusedEntities.push(e);
		}

		// Reused entities should have indices from the original set (LIFO order)
		const reusedIndices = reusedEntities.map((e) => e.index);
		for (const idx of reusedIndices) {
			expect(originalIndices).toContain(idx);
		}

		// The entity objects should be the same ones from the pool
		for (const e of reusedEntities) {
			expect(entities).toContain(e);
		}
	});

	test('Entity capacity determines max entities with components', () => {
		// Entity capacity controls the size of component data arrays
		const world = new World({ entityCapacity: 10, checksOn: false });
		world.registerComponent(PositionComponent);

		const entities: any[] = [];

		// Create entities up to capacity
		for (let i = 0; i < 10; i++) {
			const e = world.createEntity();
			e.addComponent(PositionComponent, { x: i, y: i * 2 });
			entities.push(e);
		}

		expect(entities.length).toBe(10);

		// All entities should be active and have unique indices
		const indices = new Set(entities.map((e) => e.index));
		expect(indices.size).toBe(10);

		// All entities should have correct data
		for (let i = 0; i < 10; i++) {
			expect(entities[i].active).toBe(true);
			expect(entities[i].getValue(PositionComponent, 'x')).toBe(i);
			expect(entities[i].getValue(PositionComponent, 'y')).toBe(i * 2);
		}
	});

	test('Component with empty schema works', () => {
		const EmptyTag = createComponent('EmptyTag', {});
		const world = new World({ checksOn: false });
		world.registerComponent(EmptyTag);

		const query = world.queryManager.registerQuery({ required: [EmptyTag] });

		const e = world.createEntity();
		e.addComponent(EmptyTag);

		expect(e.hasComponent(EmptyTag)).toBe(true);
		expect(query.entities.has(e)).toBe(true);
		expect(e.getComponents()).toContain(EmptyTag);

		e.removeComponent(EmptyTag);
		expect(e.hasComponent(EmptyTag)).toBe(false);
		expect(query.entities.has(e)).toBe(false);
	});

	test('Destroying entities while iterating query is safe', () => {
		const world = new World({ checksOn: false });
		world.registerComponent(HealthComponent);

		for (let i = 0; i < 10; i++) {
			world.createEntity().addComponent(HealthComponent, { value: i * 10 });
		}

		const query = world.queryManager.registerQuery({
			required: [HealthComponent],
		});

		expect(query.entities.size).toBe(10);

		// Destroy entities with health < 50 during iteration
		// Copy to array first to avoid modifying during iteration
		const toDestroy = [...query.entities].filter(
			(e) => e.getValue(HealthComponent, 'value')! < 50,
		);

		for (const e of toDestroy) {
			e.destroy();
		}

		// Should have 5 entities left (50, 60, 70, 80, 90)
		expect(query.entities.size).toBe(5);
	});

	test('World registerQuery wrapper method works', () => {
		const world = new World({ checksOn: false });
		world.registerComponent(PositionComponent);

		// Using world.registerQuery instead of world.queryManager.registerQuery
		world.registerQuery({ required: [PositionComponent] });

		const e = world.createEntity();
		e.addComponent(PositionComponent);

		// Query should have picked up the entity
		const query = world.queryManager.registerQuery({
			required: [PositionComponent],
		});
		expect(query.entities.has(e)).toBe(true);
	});

	test('Vec4 component full lifecycle', () => {
		const Vec4Comp = createComponent('Vec4Full', {
			data: { type: Types.Vec4, default: [0, 0, 0, 0] },
		});

		const world = new World({ checksOn: false });
		world.registerComponent(Vec4Comp);

		const e = world.createEntity();
		e.addComponent(Vec4Comp, { data: [1, 2, 3, 4] });

		const view = e.getVectorView(Vec4Comp, 'data');
		expect(view[0]).toBe(1);
		expect(view[1]).toBe(2);
		expect(view[2]).toBe(3);
		expect(view[3]).toBe(4);

		// Modify through view
		view[0] = 10;
		view[3] = 40;

		const view2 = e.getVectorView(Vec4Comp, 'data');
		expect(view2[0]).toBe(10);
		expect(view2[3]).toBe(40);
	});

	test('Color at exact boundaries without clamping', () => {
		const ColorComp = createComponent('ColorBoundary', {
			color: { type: Types.Color, default: [0, 0, 0, 0] },
		});

		const world = new World({ checksOn: false });
		const warn = jest.spyOn(console, 'warn').mockImplementation();
		world.registerComponent(ColorComp);

		const e = world.createEntity();
		e.addComponent(ColorComp, { color: [0, 0.5, 1, 0] });

		const view = e.getVectorView(ColorComp, 'color');
		expect(view[0]).toBe(0); // exact min
		expect(view[1]).toBeCloseTo(0.5, 5);
		expect(view[2]).toBe(1); // exact max
		expect(view[3]).toBe(0);

		// No warning for valid boundaries
		expect(warn).not.toHaveBeenCalled();
		warn.mockRestore();
	});

	test('Multiple worlds operate independently with unique components', () => {
		// Each world needs its own component definitions for full isolation
		const Pos1 = createComponent('PosWorld1', {
			x: { type: Types.Float32, default: 0 },
			y: { type: Types.Float32, default: 0 },
		});
		const Pos2 = createComponent('PosWorld2', {
			x: { type: Types.Float32, default: 0 },
			y: { type: Types.Float32, default: 0 },
		});

		const world1 = new World({ checksOn: false });
		const world2 = new World({ checksOn: false });

		world1.registerComponent(Pos1);
		world2.registerComponent(Pos2);

		const e1 = world1.createEntity();
		e1.addComponent(Pos1, { x: 10, y: 20 });

		const e2 = world2.createEntity();
		e2.addComponent(Pos2, { x: 30, y: 40 });

		// Each world has independent entities with independent component data
		expect(e1.getValue(Pos1, 'x')).toBe(10);
		expect(e2.getValue(Pos2, 'x')).toBe(30);

		// Modifying one doesn't affect the other
		e1.setValue(Pos1, 'x', 100);
		expect(e1.getValue(Pos1, 'x')).toBe(100);
		expect(e2.getValue(Pos2, 'x')).toBe(30);
	});
});

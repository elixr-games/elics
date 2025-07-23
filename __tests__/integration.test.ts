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
});

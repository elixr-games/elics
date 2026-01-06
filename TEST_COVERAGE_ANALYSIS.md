# EliCS Test Coverage Analysis

## Overview

The EliCS codebase currently has **100% line coverage** across all source files. However, line coverage doesn't tell the complete story. This document identifies areas where additional tests would improve confidence in the code's behavior and catch potential edge cases.

## Current Test Statistics

- **Test Files**: 6
- **Total Tests**: 115
- **Line Coverage**: 100%
- **Branch Coverage**: 100%
- **Function Coverage**: 100%

## Areas for Test Improvement

### 1. World Class (`world.ts`)

#### Missing Test Scenarios

**a) Unregistering Non-Existent Systems**

```typescript
// Currently untested: what happens when unregistering a system that doesn't exist?
test('unregistering non-existent system is a no-op', () => {
	const world = new World();
	class NonExistentSystem extends createSystem() {}
	expect(() => world.unregisterSystem(NonExistentSystem)).not.toThrow();
});
```

**b) `registerQuery` Method via World**

- The `world.registerQuery()` wrapper method is tested indirectly but could benefit from direct tests.

**c) Entity Capacity Boundary Testing**

```typescript
// Test behavior when approaching entityCapacity limits
test('handles entity creation at capacity boundary', () => {
	const world = new World({ entityCapacity: 5 });
	// Create entities at and beyond capacity
	const entities = Array.from({ length: 10 }, () => world.createEntity());
	// Verify behavior
});
```

---

### 2. Entity Class (`entity.ts`)

#### Missing Test Scenarios

**a) Double Destruction**

```typescript
test('destroying an already destroyed entity is safe', () => {
	const world = new World();
	const entity = world.createEntity();
	entity.destroy();
	expect(() => entity.destroy()).not.toThrow();
	expect(entity.active).toBe(false);
});
```

**b) Vector View Cache Invalidation**

```typescript
test('vector view cache is cleared when component is removed', () => {
	const world = new World();
	const VecComp = createComponent('VecTest', {
		pos: { type: Types.Vec3, default: [0, 0, 0] },
	});
	world.registerComponent(VecComp);

	const entity = world.createEntity();
	entity.addComponent(VecComp);
	const view1 = entity.getVectorView(VecComp, 'pos');

	entity.removeComponent(VecComp);
	entity.addComponent(VecComp);
	const view2 = entity.getVectorView(VecComp, 'pos');

	// Views should be different instances after re-add
	expect(view1).not.toBe(view2);
});
```

**c) Operations After Destruction**

```typescript
test('setValue on destroyed entity is safe', () => {
	const world = new World();
	const PosComp = createComponent('PosDestroy', {
		x: { type: Types.Float32, default: 0 },
	});
	world.registerComponent(PosComp);

	const entity = world.createEntity();
	entity.addComponent(PosComp);
	entity.destroy();

	// Should not throw, should be no-op
	expect(() => entity.setValue(PosComp, 'x', 100)).not.toThrow();
});
```

---

### 3. Component System (`component.ts`)

#### Missing Test Scenarios

**a) Schema Field Edge Cases**

```typescript
test('component with empty schema', () => {
	const EmptyComp = createComponent('Empty', {});
	const world = new World();
	world.registerComponent(EmptyComp);
	const entity = world.createEntity();
	entity.addComponent(EmptyComp);
	expect(entity.hasComponent(EmptyComp)).toBe(true);
});
```

**b) All Data Types with Min/Max Constraints**

```typescript
// Currently only some numeric types are tested with range constraints
test('Int8 with range constraints', () => {
	/* ... */
});
test('Float64 with range constraints', () => {
	/* ... */
});
```

**c) ComponentRegistry Edge Cases**

```typescript
test('ComponentRegistry persists across World instances', () => {
	// Verify registry is global/static behavior
});
```

---

### 4. Query System (`query.ts`, `query-manager.ts`)

#### Missing Test Scenarios

**a) Complex Multi-Predicate Queries**

```typescript
test('query with multiple value predicates on same component', () => {
	const world = new World();
	const NumComp = createComponent('NumMulti', {
		value: { type: Types.Int16, default: 50 },
	});
	world.registerComponent(NumComp);

	// Query for value > 10 AND value < 100
	const query = world.queryManager.registerQuery({
		required: [NumComp],
		where: [
			{ component: NumComp, key: 'value', op: 'gt', value: 10 },
			{ component: NumComp, key: 'value', op: 'lt', value: 100 },
		],
	});
	// ... test various entity values
});
```

**b) Query Deduplication**

```typescript
test('identical queries return same Query instance', () => {
	const world = new World();
	const Comp = createComponent('QueryDedup', {
		x: { type: Types.Int8, default: 0 },
	});
	world.registerComponent(Comp);

	const q1 = world.queryManager.registerQuery({ required: [Comp] });
	const q2 = world.queryManager.registerQuery({ required: [Comp] });

	expect(q1).toBe(q2);
});
```

**c) Subscription Cleanup**

```typescript
test('unsubscribed callbacks are not called', () => {
	// Test that unsubscribe function properly removes callback
});

test('multiple subscriptions to same event', () => {
	// Test multiple callbacks on same query event
});
```

**d) Value Predicate Type Coercion**

```typescript
test('Boolean value predicates', () => {
	// Test eq/ne on Boolean fields
});

test('String value predicates with special characters', () => {
	// Test string matching with unicode, empty strings, etc.
});
```

---

### 5. System (`system.ts`)

#### Missing Test Scenarios

**a) System with Multiple Config Types**

```typescript
test('system config supports all schema types', () => {
	class MultiConfigSystem extends createSystem(
		{},
		{
			intVal: { type: Types.Int16, default: 0 },
			floatVal: { type: Types.Float32, default: 0.0 },
			boolVal: { type: Types.Boolean, default: false },
			strVal: { type: Types.String, default: '' },
		},
	) {}

	const world = new World();
	world.registerSystem(MultiConfigSystem, {
		configData: {
			intVal: 42,
			floatVal: 3.14,
			boolVal: true,
			strVal: 'test',
		},
	});
	// Verify all configs set correctly
});
```

**b) System Priority Edge Cases**

```typescript
test('systems with equal priority maintain registration order', () => {
	// Test deterministic ordering when priorities are equal
});

test('negative priority values', () => {
	// Test system ordering with negative priorities
});
```

**c) System Lifecycle**

```typescript
test('system destroy is called before removal from systems list', () => {
	// Verify destroy() timing
});
```

---

### 6. BitSet (`bit-set.ts`)

#### Missing Test Scenarios

**a) Extreme Bit Positions**

```typescript
test('handles bit positions beyond 128', () => {
	const bs = new BitSet();
	bs.set(200, 1);
	expect(bs.toArray()).toContain(200);
});
```

**b) Performance with Large Sets**

```typescript
test('operations remain efficient with many bits set', () => {
	const bs = new BitSet();
	for (let i = 0; i < 1000; i += 7) {
		bs.set(i, 1);
	}
	// Verify operations complete in reasonable time
});
```

---

### 7. Integration and Stress Tests

#### Missing Test Scenarios

**a) Rapid Entity Lifecycle**

```typescript
test('rapid create/destroy cycles maintain consistency', () => {
	const world = new World({ entityCapacity: 100 });
	// Register components and queries

	for (let i = 0; i < 1000; i++) {
		const entity = world.createEntity();
		entity.addComponent(SomeComponent);
		if (Math.random() > 0.5) {
			entity.destroy();
		}
	}

	// Verify query consistency
});
```

**b) Multi-System Interaction**

```typescript
test('systems can safely modify entities during iteration', () => {
	// Test creating/destroying entities within system update()
});
```

**c) Entity Pool Exhaustion and Growth**

```typescript
test('entity pool correctly expands beyond initial capacity', () => {
	const world = new World({ entityCapacity: 5 });
	const entities = [];

	for (let i = 0; i < 50; i++) {
		entities.push(world.createEntity());
	}

	expect(entities.length).toBe(50);
	// All entities should be active and unique
});
```

---

### 8. Error Handling and Edge Cases

#### Missing Test Scenarios

**a) Invalid Type Handling**

```typescript
test('assertCondition with checksOn=false skips validation', () => {
	// Verify error paths are skipped when checks are off
});
```

**b) Concurrent Access Patterns**

```typescript
test('modifying entities while iterating query results', () => {
	// Test safe iteration patterns
});
```

**c) Memory Cleanup**

```typescript
test('destroyed entities release references properly', () => {
	// Verify no memory leaks from entity pooling
});
```

---

### 9. Type-Specific Tests

#### Vec4 Type

```typescript
test('Vec4 component operations', () => {
	const Vec4Comp = createComponent('Vec4Test', {
		data: { type: Types.Vec4, default: [0, 0, 0, 0] },
	});
	// Full CRUD operations on Vec4
});
```

#### Color Type Edge Cases

```typescript
test('Color with exactly boundary values (0 and 1)', () => {
	// Test Color at exact boundaries without clamping
});
```

#### Entity Reference Circular References

```typescript
test('entity referencing itself', () => {
	const RefComp = createComponent('SelfRef', {
		self: { type: Types.Entity, default: null },
	});
	const world = new World();
	world.registerComponent(RefComp);

	const entity = world.createEntity();
	entity.addComponent(RefComp, { self: entity });

	expect(entity.getValue(RefComp, 'self')).toBe(entity);
});
```

---

## Recommendations

### High Priority

1. **Double destruction safety** - Ensure calling `destroy()` multiple times is safe
2. **Subscription cleanup validation** - Verify unsubscribed callbacks don't fire
3. **Entity pool boundary tests** - Test behavior at capacity limits
4. **System modification during update** - Test entity changes during system iteration

### Medium Priority

1. **All data types with constraints** - Ensure min/max works for all numeric types
2. **Complex predicate combinations** - Multiple where clauses on queries
3. **Negative and floating-point priorities** - System ordering edge cases
4. **Empty schema components** - Components with no data fields

### Low Priority (Nice to Have)

1. **Performance regression tests** - Baseline timing tests
2. **Memory leak detection** - Track allocations across entity lifecycle
3. **Concurrent modification patterns** - Document and test safe patterns
4. **Large-scale stress tests** - 10,000+ entities and components

---

## Implementation Notes

When implementing these tests:

1. **Use `beforeEach` with fresh World instances** to ensure test isolation
2. **Clear ComponentRegistry between test suites** if testing component creation
3. **Mock `console.warn`** when testing warning paths
4. **Consider test performance** - some stress tests should be marked as slow or skipped in CI

## Conclusion

While the codebase has 100% line coverage, these additional tests would:

- Catch potential edge cases and race conditions
- Improve confidence in error handling paths
- Document expected behavior for unusual scenarios
- Serve as regression tests for future changes

The recommended tests focus on behavioral coverage rather than just line coverage, ensuring the ECS framework handles all real-world usage patterns correctly.

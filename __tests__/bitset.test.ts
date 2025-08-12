import BitSet from '../src/bit-set';
import { World } from '../src/world';
import { createComponent } from '../src/component';
import { Types } from '../src/types';

// Dedicated tests to ensure full coverage of BitSet operations

describe('BitSet utility functions', () => {
	test('basic operations work correctly', () => {
		const set = new BitSet();
		expect(set.isEmpty()).toBe(true);

		// set bits and read them back
		set.set(0, 1);
		set.set(3, 1);
		expect(set.toArray()).toEqual([0, 3]);
		expect(set.toString()).toBe(String((1 << 0) | (1 << 3)));

		// clearing a bit
		set.set(3, 0);
		expect(set.toArray()).toEqual([0]);

		const other = new BitSet();
		other.set(2, 1);

		// boolean helpers
		expect(set.contains(new BitSet(1))).toBe(true);
		expect(set.intersects(other)).toBe(false);

		// in place operations
		set.orInPlace(other);
		expect(set.toArray()).toEqual([0, 2]);
		set.andNotInPlace(other);
		expect(set.toArray()).toEqual([0]);

		// returning new sets
		expect(set.or(other).toArray()).toEqual([0, 2]);
		expect(set.and(other).toArray()).toEqual([]);
		expect(set.andNot(other).toArray()).toEqual([0]);

		// equality
		const clone = new BitSet(set.bits);
		expect(clone.equals(set)).toBe(true);
	});

	test('constructor from Uint32Array and multiword toString', () => {
		const bs = new BitSet(new Uint32Array([1, 0x80000000])); // bits 0 and 63
		expect(bs.toArray()).toEqual(expect.arrayContaining([0, 63]));
		// multiword format prints high-to-low hex words joined by '-'
		expect(bs.toString()).toBe('80000000-1');
		// bits getter returns low word
		expect(bs.bits).toBe(1);
	});

	test('orInPlace grows, andNotInPlace clears only overlapping', () => {
		const a = new BitSet();
		const b = new BitSet();
		b.set(63, 1);
		a.orInPlace(b);
		expect(a.contains(b)).toBe(true);
		expect(a.toArray()).toEqual([63]);

		// set low and high bits, then clear low via andNotInPlace
		a.set(0, 1);
		a.set(32, 1);
		const c = new BitSet();
		c.set(0, 1);
		a.andNotInPlace(c);
		expect(a.toArray().sort((x, y) => x - y)).toEqual([32, 63]);
	});

	test('contains/intersects across sizes and equals with trailing zeros', () => {
		const small = new BitSet();
		small.set(0, 1);
		const big = new BitSet();
		big.set(64, 1);
		expect(small.contains(big)).toBe(false);
		expect(small.intersects(big)).toBe(false);

		// equals considers implicit zeros in longer mask
		const longer = new BitSet(new Uint32Array([small.bits, 0]));
		expect(longer.equals(small)).toBe(true);

		// clear empties all words
		longer.clear();
		expect(longer.isEmpty()).toBe(true);
	});

	test('word-length mismatch paths for or/and/andNot/equals', () => {
		const small = new BitSet();
		small.set(0, 1);
		const large = new BitSet();
		large.set(64, 1);

		// or both directions covers (a[i] ?? 0) and (b[i] ?? 0)
		const o1 = large.or(small);
		expect(o1.toArray().sort((a, b) => a - b)).toEqual([0, 64]);
		const o2 = small.or(large);
		expect(o2.toArray().sort((a, b) => a - b)).toEqual([0, 64]);

		// and yields empty when disjoint (both directions)
		expect(large.and(small).toArray()).toEqual([]);
		expect(small.and(large).toArray()).toEqual([]);

		// andNot retains only unique bits
		expect(large.andNot(small).toArray()).toEqual([64]);
		expect(small.andNot(large).toArray()).toEqual([0]);

		// equals is false when higher words differ
		expect(large.equals(small)).toBe(false);

		// equals handles trailing zero words on the other side too
		const longer2 = new BitSet(new Uint32Array([small.bits, 0, 0]));
		expect(small.equals(longer2)).toBe(true);
	});
});

describe('BitSet integration across >32 components', () => {
	test('Queries and events work across word boundaries', () => {
		const world = new World({ entityCapacity: 10, checksOn: false });
		const comps = Array.from({ length: 64 }, (_, i) =>
			createComponent(`C${i}`, { v: { type: Types.Int8, default: i } }),
		);
		comps.forEach((c) => world.registerComponent(c));

		const entity = world.createEntity();
		const required = [comps[0], comps[31], comps[32], comps[63]];
		const excluded = [comps[10]];
		const query = world.queryManager.registerQuery({ required, excluded });

		const qualify = jest.fn();
		const disqualify = jest.fn();
		query.subscribe('qualify', qualify);
		query.subscribe('disqualify', disqualify);

		entity.addComponent(comps[0]);
		entity.addComponent(comps[31]);
		entity.addComponent(comps[32]);
		expect(qualify).toHaveBeenCalledTimes(0);
		entity.addComponent(comps[10]);
		entity.addComponent(comps[63]);
		// remove excluded, should now qualify once
		entity.removeComponent(comps[10]);
		expect(qualify).toHaveBeenCalledTimes(1);
		entity.removeComponent(comps[32]);
		expect(disqualify).toHaveBeenCalledTimes(1);
	});
});

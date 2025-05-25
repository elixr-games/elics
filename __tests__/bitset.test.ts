import BitSet from '../src/bit-set';

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
});

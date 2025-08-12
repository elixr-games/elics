export default class BitSet {
	private words: Uint32Array;

	constructor(init: number | Uint32Array = 0) {
		if (typeof init === 'number') {
			this.words = new Uint32Array(1);
			// treat number as initial lower 32-bit mask value
			this.words[0] = init >>> 0;
		} else {
			this.words = new Uint32Array(init.length);
			this.words.set(init);
		}
	}

	// Back-compat for tests referencing .bits
	get bits(): number {
		return this.words[0] >>> 0;
	}

	private ensure(wordIndex: number) {
		if (wordIndex < this.words.length) return;
		const nextLen = Math.max(this.words.length << 1, wordIndex + 1);
		const n = new Uint32Array(nextLen);
		n.set(this.words);
		this.words = n;
	}

	set(bitIndex: number, value: number) {
		const w = (bitIndex / 32) | 0;
		const b = bitIndex & 31;
		this.ensure(w);
		const mask = 1 << b;
		if (value) this.words[w] |= mask;
		else this.words[w] &= ~mask;
	}

	or(other: BitSet): BitSet {
		const out = new BitSet(
			new Uint32Array(Math.max(this.words.length, other.words.length)),
		);
		const a = this.words,
			b = other.words,
			o = out.words;
		const max = o.length;
		for (let i = 0; i < max; i++) {
			o[i] = (a[i] ?? 0) | (b[i] ?? 0);
		}
		return out;
	}

	and(other: BitSet): BitSet {
		const out = new BitSet(
			new Uint32Array(Math.max(this.words.length, other.words.length)),
		);
		const a = this.words,
			b = other.words,
			o = out.words;
		const max = o.length;
		for (let i = 0; i < max; i++) {
			o[i] = (a[i] ?? 0) & (b[i] ?? 0);
		}
		return out;
	}

	andNot(other: BitSet): BitSet {
		const out = new BitSet(
			new Uint32Array(Math.max(this.words.length, other.words.length)),
		);
		const a = this.words,
			b = other.words,
			o = out.words;
		const max = o.length;
		for (let i = 0; i < max; i++) {
			o[i] = (a[i] ?? 0) & ~(b[i] ?? 0);
		}
		return out;
	}

	orInPlace(other: BitSet): void {
		this.ensure(other.words.length - 1);
		const a = this.words,
			b = other.words;
		for (let i = 0; i < b.length; i++) a[i] |= b[i];
	}

	andNotInPlace(other: BitSet): void {
		const a = this.words,
			b = other.words;
		const max = Math.min(a.length, b.length);
		for (let i = 0; i < max; i++) a[i] &= ~b[i];
	}

	equals(other: BitSet): boolean {
		const max = Math.max(this.words.length, other.words.length);
		for (let i = 0; i < max; i++) {
			const a = this.words[i] ?? 0;
			const b = other.words[i] ?? 0;
			if (a !== b) return false;
		}
		return true;
	}

	isEmpty(): boolean {
		const w = this.words;
		for (let i = 0; i < w.length; i++) if (w[i] !== 0) return false;
		return true;
	}

	clear(): void {
		this.words.fill(0);
	}

	toArray(): number[] {
		const out: number[] = [];
		const w = this.words;
		for (let wi = 0; wi < w.length; wi++) {
			let word = w[wi];
			while (word) {
				const t = word & -word; // lowbit
				const bit = 31 - Math.clz32(t);
				out.push((wi << 5) + bit);
				word &= word - 1;
			}
		}
		return out;
	}

	toString(): string {
		if (this.words.length === 1) return this.words[0].toString();
		// Hex words from high->low to produce stable mask ids
		let s = '';
		for (let i = this.words.length - 1; i >= 0; i--) {
			const hex = this.words[i].toString(16);
			s += i === this.words.length - 1 ? hex : '-' + hex;
		}
		return s;
	}

	contains(other: BitSet): boolean {
		const a = this.words,
			b = other.words;
		const n = b.length;
		for (let i = 0; i < n; i++) {
			const aw = (a[i] ?? 0) >>> 0;
			const bw = b[i] >>> 0;
			if ((aw & bw) >>> 0 !== bw) return false;
		}
		return true;
	}

	intersects(other: BitSet): boolean {
		const a = this.words,
			b = other.words;
		const n = Math.min(a.length, b.length);
		for (let i = 0; i < n; i++) if ((a[i] & b[i]) >>> 0 !== 0) return true;
		return false;
	}
}

export default class BitSet {
    bits: number;
    constructor(bits = 0) {
        this.bits = bits >>> 0;
    }
    set(bit: number, value: number) {
        const mask = 1 << bit;
        if (value) {
            this.bits |= mask;
        } else {
            this.bits &= ~mask;
        }
    }
    or(other: BitSet): BitSet {
        return new BitSet(this.bits | other.bits);
    }
    and(other: BitSet): BitSet {
        return new BitSet(this.bits & other.bits);
    }
    andNot(other: BitSet): BitSet {
        return new BitSet(this.bits & ~other.bits);
    }
    orInPlace(other: BitSet): void {
        this.bits |= other.bits;
    }
    andNotInPlace(other: BitSet): void {
        this.bits &= ~other.bits;
    }
    equals(other: BitSet): boolean {
        return this.bits === other.bits;
    }
    isEmpty(): boolean {
        return this.bits === 0;
    }
    toArray(): number[] {
        const arr: number[] = [];
        for (let i = 0; i < 32; i++) {
            if (this.bits & (1 << i)) arr.push(i);
        }
        return arr;
    }
    toString(): string {
        return this.bits.toString();
    }
    contains(other: BitSet): boolean {
        return (this.bits & other.bits) === other.bits;
    }
    intersects(other: BitSet): boolean {
        return (this.bits & other.bits) !== 0;
    }
}

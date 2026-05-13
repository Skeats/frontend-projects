export class Bitboard {

    private bitboard: bigint;

    public constructor(bitboard: bigint = 0n) {
        this.bitboard = bitboard;
    }

    public getBoard(): bigint {
        return this.bitboard;
    }

    public setBoard(bitboard: bigint) {
        this.bitboard = bitboard;
    }

    public getBit(index: number): boolean {
        return(this.bitboard & (1n << BigInt(index))) !== 0n
    }

    public setBit(index: number, value: boolean = true) {
        if (value) {
            this.bitboard |= (1n << BigInt(index));
        } else {
            this.bitboard &= ~(1n << BigInt(index));
        }
    }

    public toggleBit(index: number) {
        this.bitboard ^= (1n << BigInt(index));
    }

    public clear() {
        this.bitboard = 0n;
    }

    public and(other: Bitboard): Bitboard {
        return new Bitboard(this.bitboard & other.bitboard);
    }

    public or(other: Bitboard): Bitboard {
        return new Bitboard(this.bitboard | other.bitboard);
    }

    public xor(other: Bitboard): Bitboard {
        return new Bitboard(this.bitboard ^ other.bitboard);
    }

    public not(): Bitboard {
        return new Bitboard(~this.bitboard);
    }

    public getLowestSetBitIndex(): number {
        return Math.log2(Number(this.bitboard & -this.bitboard));
    }

    public getIndices(): number[] {
        let tempBoard: Bitboard = new Bitboard(this.bitboard);
        const indices: number[] = [];

        while (tempBoard.bitboard != 0n) {
            indices.push(tempBoard.getLowestSetBitIndex())
            tempBoard.setBit(indices[indices.length - 1], false);
        }

        return indices;
    }

    // Generates a bitboard from a set of indices that indicate which bits should be on or off
    static fromIndices(...indices: number[]): Bitboard {
        const board: Bitboard = new Bitboard(0n);

        for (const index of indices) {
            board.setBit(index, true);
        }

        return board;
    }
}
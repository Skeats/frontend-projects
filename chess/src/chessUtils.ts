// Enum for pieces and sides
export enum PieceTypes {
    NONE = 0,
    PAWN,
    KNIGHT,
    BISHOP,
    ROOK,
    QUEEN,
    KING,
}

export enum Players {
    NONE = -1,
    WHITE = 0,
    BLACK = 6,
}

export enum Pieces {
    NONE = 0,
    WHITE_PAWN = 1,
    WHITE_KNIGHT = 2,
    WHITE_BISHOP = 3,
    WHITE_ROOK = 4,
    WHITE_QUEEN = 5,
    WHITE_KING = 6,
    BLACK_PAWN = 7,
    BLACK_KNIGHT = 8,
    BLACK_BISHOP = 9,
    BLACK_ROOK = 10,
    BLACK_QUEEN = 11,
    BLACK_KING = 12,
}

// prettier-ignore
export enum boardSquares {
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1
};

export function isOppositeColor(color1: Players, color2: Players): boolean {
    return (color1 == Players.BLACK && color2 == Players.WHITE) ||
        (color1 == Players.WHITE && color2 == Players.BLACK);
}

export const littleEndianRegex: RegExp = /[a-h][1-8]/;
export const startingBoardPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

export const directionOffsets = [8, -8, 1, -1, 9, -7, -9, 7];
export const knightJumpOffsets = [ 15, 17, -17, -15, 10, -6, 6, -10 ];
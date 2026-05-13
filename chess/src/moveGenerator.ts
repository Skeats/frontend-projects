import { Bitboard } from "./bitboard";
import { ChessBoard } from "./chessBoard";
import { Piece } from "./chessPiece";
import { directionOffsets, isOppositeColor, knightJumpOffsets, Pieces, PieceTypes, Players } from "./chessUtils";

export class StaticMoveData {
    public readonly numSquaresToEdge: number[][] = [];
    public readonly knightMoves: number [][] = [];
    public readonly knightAttackBitboards: Bitboard[] = [];
    public readonly kingMoves: number [][] = [];
    public readonly kingAttackBitboards: Bitboard[] = [];

    public constructor() {
        for (let index = 0; index < 64; index++) {
            const y = Math.floor(index / 8);
			const x = index - y * 8;

            const numNorth = 7 - y;
            const numSouth = y;
            const numWest = x;
            const numEast = 7 - x;

            this.numSquaresToEdge[index] = [
                numNorth,
                numSouth,
                numEast,
                numWest,
                Math.min(numNorth, numEast),
                Math.min(numSouth, numEast),
                Math.min(numSouth, numWest),
                Math.min(numNorth, numWest),
            ];

            // Calculate Knight Moves/Attack Boards
            const legalKnightMoves: number[] = [];
            this.knightAttackBitboards.push(new Bitboard());
            for (const knightJumpOffset of knightJumpOffsets) {
                const jumpSquare = index + knightJumpOffset;

                if (jumpSquare >= 0 && jumpSquare < 64) {
                    const jumpSquareY = Math.floor(jumpSquare / 8);
                    const jumpSquareX = jumpSquare - jumpSquareY * 8;

                    const maxMoveDistance = Math.max(Math.abs(x - jumpSquareX), Math.abs(y - jumpSquareY));

                    if (maxMoveDistance == 2) {
                        legalKnightMoves.push(jumpSquare);
                        this.knightAttackBitboards[index].setBit(jumpSquare);
                    }
                }
            }
            this.knightMoves[index] = legalKnightMoves;

            // Calculate King Moves/Attack Boards
            const legalKingMoves: number[] = [];
            this.kingAttackBitboards.push(new Bitboard());
            for (const kingMoveOffset of directionOffsets) {
                const moveSquare = index + kingMoveOffset;

                if (moveSquare >= 0 && moveSquare < 64) {
                    const moveSquareY = Math.floor(moveSquare / 8);
                    const moveSquareX = moveSquare - moveSquareY * 8;

                    const maxMoveDistance = Math.max(Math.abs(x - moveSquareX), Math.abs(y - moveSquareY));
                    if (maxMoveDistance == 1) {
                        legalKingMoves.push(moveSquare);
                        this.kingAttackBitboards[index].setBit(moveSquare);
                    }
                }
            }
            this.kingMoves[index] = legalKingMoves;
        }
    }
}

export const staticMoveData = new StaticMoveData();

export function generateMoves(board: ChessBoard): Move[] {
    let moves: Move[] = [];

    moves.push(...generateKingMoves(board));
    moves.push(...generateKnightMoves(board));

    for (const piece of board.getPieces()) {
        if (piece.isRealPiece() && piece.getColor() === board.getActivePlayer()) {
            // If all of these conditions pass, then we want to generate moves for this piece
            switch(piece.getType()) {
                case(PieceTypes.BISHOP):
                case(PieceTypes.ROOK):
                case(PieceTypes.QUEEN):
                    moves.push(...generateSlidingMoves(piece, board));
                    break;
                case(PieceTypes.KNIGHT):
                    break;
                case(PieceTypes.PAWN):
                    break;
            }
        }
    }
    return moves;
}

function generateSlidingMoves(piece: Piece, board: ChessBoard): Move[] {
    let moves: Move[] = []

    let startIndex: number = piece.getType() == PieceTypes.BISHOP ? 4 : 0;
    let endIndex: number = piece.getType() == PieceTypes.ROOK ? 4 : 8;

    for (let direction = startIndex; direction < endIndex; direction++) {
        for (let n = 0; n < staticMoveData.numSquaresToEdge[piece.getPosition()][direction]; n++) {
            const targetSquare = piece.getPosition() + directionOffsets[direction] * (n + 1);
            const targetPiece: Piece = board.getPieceAtIndex(targetSquare);

            if (targetPiece.getColor() == piece.getColor()) {
                break;
            }

            // Make sure we check that the piece at the target square is actually a piece, since getPieceAtIndex will still return a valid piece object.
            if (
                board.hasPieceAtIndex(targetSquare) &&
                targetPiece.getColor() != piece.getColor()) {
                moves.push(new Move(piece.getPosition(), targetSquare, true));
                break;
            }

            moves.push(new Move(piece.getPosition(), targetSquare));
        }
    }
    return moves;
}

function generateKnightMoves(board: ChessBoard): Move[] {
    let moves: Move[] = []

    const activeColor: Players = board.getActivePlayer();
    const activeColorBitboard = board.getColorPositionBitboard(activeColor);

    const knights = board.getPiecePositionBitboard(PieceTypes.KNIGHT).and(activeColorBitboard);
    const moveMask = activeColorBitboard.not();

    while (knights.getBoard() != 0n)  {
        const knightSquare = knights.getLowestSetBitIndex();
        const moveSquares = Bitboard.fromIndices(...staticMoveData.knightMoves[knightSquare]).and(moveMask);
        knights.setBit(knightSquare, false);

        while (moveSquares.getBoard() != 0n) {
            const targetSquare = moveSquares.getLowestSetBitIndex();
            const targetPiece = board.getPieceAtIndex(targetSquare);
            moveSquares.setBit(targetSquare, false);
            moves.push(new Move(knightSquare, targetSquare, isOppositeColor(activeColor, targetPiece.getColor())));
        }
    }

    return moves;
}

function generateKingMoves(board: ChessBoard): Move[] {
    let moves: Move[] = []

    const activeColor: Players = board.getActivePlayer();

    const kingPosition: number = board.getPiecePositionBitboard(PieceTypes.KING).and(board.getColorPositionBitboard(activeColor)).getLowestSetBitIndex();

    const legalMoveMask = board.getColorPositionBitboard(activeColor).not();
    let kingMoves = Bitboard.fromIndices(...staticMoveData.kingMoves[kingPosition]).and(legalMoveMask);

    while (kingMoves.getBoard() != 0n) {
        const targetSquare = kingMoves.getLowestSetBitIndex();
        const targetPiece = board.getPieceAtIndex(targetSquare);
        kingMoves.setBit(targetSquare, false);
        moves.push(new Move(kingPosition, targetSquare, isOppositeColor(activeColor, targetPiece.getColor())));
    }

    return moves;
}

export class Move {
    private startSquare: number;
    private endSquare: number;

    private isCapture: boolean;

    public constructor(startSquare: number, endSquare: number, isCapture: boolean = false) {
        this.startSquare = startSquare;
        this.endSquare = endSquare;
        this.isCapture = isCapture;
    }

    public getStartSquare(): number {
        return this.startSquare;
    }

    public getEndSquare(): number {
        return this.endSquare;
    }

    public checkIsCapture(): boolean {
        return this.isCapture;
    }
}
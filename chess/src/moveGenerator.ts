import { Bitboard } from "./bitboard";
import { ChessBoard } from "./chessBoard";
import { Piece } from "./chessPiece";
import {
    directionOffsets,
    getOppositeColor,
    isOppositeColor,
    knightJumpOffsets,
    Pieces,
    PieceTypes,
    Players,
} from "./chessUtils";

export class StaticMoveData {
    public readonly numSquaresToEdge: number[][] = [];
    public readonly knightMoves: number[][] = [];
    public readonly knightAttackBitboards: Bitboard[] = [];
    public readonly kingMoves: number[][] = [];
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

                    const maxMoveDistance = Math.max(
                        Math.abs(x - jumpSquareX),
                        Math.abs(y - jumpSquareY),
                    );

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

                    const maxMoveDistance = Math.max(
                        Math.abs(x - moveSquareX),
                        Math.abs(y - moveSquareY),
                    );
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

export class MoveGenerator {
    // A Bitboard containing only 1's for all 64 bits
    static readonly allOnes: Bitboard = new Bitboard(0xffffffffffffffffn);

    // Convenience data
    private board: ChessBoard = new ChessBoard();
    private activeColor: Players = Players.NONE;
    private inactiveColor: Players = Players.NONE;
    private activeColorBitboard: Bitboard = new Bitboard();
    private inactiveColorBitboard: Bitboard = new Bitboard();

    private inactiveColorAttackMap: Bitboard = new Bitboard();

    private generateQuietMoves: boolean = true;

    private isInCheck: boolean = false;
    private isInDoubleCheck: boolean = false;
    private checkRayMask: Bitboard = new Bitboard();

    private pinRays: Bitboard = new Bitboard();

    private moveTypeMask: Bitboard = new Bitboard();

    public generateMoves(
        board: ChessBoard,
        capturesOnly: boolean = false,
    ): Move[] {
        let moves: Move[] = [];
        this.updateData(board, capturesOnly);

        moves.push(...this.generateKingMoves());

        if (!this.isInDoubleCheck) {
            moves.push(...this.generateKnightMoves());
        }

        for (const piece of board.getPieces()) {
            if (
                piece.isRealPiece() &&
                piece.getColor() === board.getActivePlayer()
            ) {
                // If all of these conditions pass, then we want to generate moves for this piece
                switch (piece.getType()) {
                    case PieceTypes.BISHOP:
                    case PieceTypes.ROOK:
                    case PieceTypes.QUEEN:
                        moves.push(...this.generateSlidingMoves(piece));
                        break;
                    case PieceTypes.KNIGHT:
                        break;
                    case PieceTypes.PAWN:
                        break;
                }
            }
        }
        return moves;
    }

    private updateData(board: ChessBoard, capturesOnly: boolean) {
        this.board = board;
        this.generateQuietMoves = !capturesOnly;
        this.activeColor = board.getActivePlayer();
        this.inactiveColor = getOppositeColor(this.activeColor);
        this.activeColorBitboard = board.getColorPositionBitboard(
            this.activeColor,
        );
        this.inactiveColorBitboard = board.getColorPositionBitboard(
            this.inactiveColor,
        );

        // We add this to the move masks for each piece to filter out "quiet" moves: moves that don't capture a piece
        this.moveTypeMask = this.generateQuietMoves
            ? MoveGenerator.allOnes
            : this.inactiveColorBitboard;

        this.isInCheck = false;
        this.isInDoubleCheck = false;
        this.checkRayMask.clear();
        this.pinRays.clear();
    }

    private generateSlidingMoves(piece: Piece): Move[] {
        let moves: Move[] = [];

        let startIndex: number = piece.getType() == PieceTypes.BISHOP ? 4 : 0;
        let endIndex: number = piece.getType() == PieceTypes.ROOK ? 4 : 8;

        for (let direction = startIndex; direction < endIndex; direction++) {
            for (
                let n = 0;
                n <
                staticMoveData.numSquaresToEdge[piece.getPosition()][direction];
                n++
            ) {
                const targetSquare =
                    piece.getPosition() + directionOffsets[direction] * (n + 1);
                const targetPiece: Piece =
                    this.board.getPieceAtIndex(targetSquare);

                if (targetPiece.getColor() == piece.getColor()) {
                    break;
                }

                // Make sure we check that the piece at the target square is actually a piece, since getPieceAtIndex will still return a valid piece object.
                if (
                    this.board.hasPieceAtIndex(targetSquare) &&
                    targetPiece.getColor() != piece.getColor()
                ) {
                    moves.push(
                        new Move(piece.getPosition(), targetSquare, true),
                    );
                    break;
                }

                moves.push(new Move(piece.getPosition(), targetSquare));
            }
        }
        return moves;
    }

    private generateKnightMoves(): Move[] {
        let moves: Move[] = [];

        // Get the position of all knights that match the current active player's color
        const knights = this.board
            .getPiecePositionBitboard(PieceTypes.KNIGHT)
            .and(this.activeColorBitboard);

        // Mask out any positions that we don't want the knights to be able to move to
        const moveMask = this.activeColorBitboard.not();

        while (knights.getBoard() != 0n) {
            // Gets the position of the first knight in the board, as well as a board containing all of the squares that knight attacks
            const knightSquare = knights.getLowestSetBitIndex();
            const moveSquares =
                staticMoveData.knightAttackBitboards[knightSquare].and(
                    moveMask,
                );
            knights.setBit(knightSquare, false);

            while (moveSquares.getBoard() != 0n) {
                // Adds each valid move to the movelist, also calculating if a move is a capture
                const targetSquare = moveSquares.getLowestSetBitIndex();
                const targetPiece = this.board.getPieceAtIndex(targetSquare);
                moveSquares.setBit(targetSquare, false);
                moves.push(
                    new Move(
                        knightSquare,
                        targetSquare,
                        isOppositeColor(
                            this.activeColor,
                            targetPiece.getColor(),
                        ),
                    ),
                );
            }
        }

        return moves;
    }

    private generateKingMoves(): Move[] {
        let moves: Move[] = [];

        // Gets the active colors king position (the assumption is that there's only 1 king, but it could easily be modified to support multiple kings if that's ever a thing that I want to support)
        const kingPosition: number = this.board
            .getPiecePositionBitboard(PieceTypes.KING)
            .and(this.activeColorBitboard)
            .getLowestSetBitIndex();

        const legalMoveMask = this.activeColorBitboard.not();
        let kingMoves = Bitboard.fromIndices(
            ...staticMoveData.kingMoves[kingPosition],
        ).and(legalMoveMask);

        while (kingMoves.getBoard() != 0n) {
            const targetSquare = kingMoves.getLowestSetBitIndex();
            const targetPiece = this.board.getPieceAtIndex(targetSquare);
            kingMoves.setBit(targetSquare, false);
            moves.push(
                new Move(
                    kingPosition,
                    targetSquare,
                    isOppositeColor(this.activeColor, targetPiece.getColor()),
                ),
            );
        }

        return moves;
    }
}

export class Move {
    private startSquare: number;
    private endSquare: number;

    private isCapture: boolean;

    public constructor(
        startSquare: number,
        endSquare: number,
        isCapture: boolean = false,
    ) {
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

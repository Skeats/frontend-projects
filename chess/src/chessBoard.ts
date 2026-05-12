import { Piece } from "./chessPiece";
import { Pieces, PieceTypes, Players } from "./chessUtils";

export class ChessBoard {
    private board: Array<Pieces>;
    private activePlayer: Players = Players.WHITE;
    private castleRights: CastleRights;
    private enPassantindex: number;
    private halfMoveClock: number;
    private fullMoves: number;

    private pieceList: Array<Piece> = [];
    private whiteBoard: bigint = 0n;
    private blackBoard: bigint = 0n;
    private pawnBoard: bigint = 0n;
    private knightBoard: bigint = 0n;
    private rookBoard: bigint = 0n;
    private bishopBoard: bigint = 0n;
    private queenBoard: bigint = 0n;
    private kingBoard: bigint = 0n;

    static readonly littleEndianRegex: RegExp = /[a-h][1-8]/;
    static readonly startingBoardPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";

    public constructor(
        board: Array<Pieces>,
        activePlayer: Players,
        castleRights: CastleRights,
        enPassantindex: number,
        halfMoveClock: number,
        fullMoves: number,
    ) {
        this.board = board;
        this.activePlayer = activePlayer;
        this.castleRights = castleRights;
        this.enPassantindex = enPassantindex;
        this.halfMoveClock = halfMoveClock;
        this.fullMoves = fullMoves;
        this.refreshBoard();
    }

    public makeMove(): boolean {
        return false
    }

    public unmakeMove(): boolean {
        return false
    }

    public getBoard(): Array<Pieces> {
        return this.board;
    }

    public getPieces(): Array<Piece> {
        return this.pieceList;
    }

    public refreshBoard() {
        this.refreshPieceList();
        this.calculatePositionBitboards();
    }

    public getActivePlayer(): Players {
        return this.activePlayer;
    }

    public canEnPassant(): boolean {
        return this.enPassantindex >= 0;
    }

    public getEnPassantIndex(): number {
        return this.enPassantindex;
    }

    public getHalfMoveClock(): number {
        return this.halfMoveClock;
    }

    public getFullMoves(): number {
        return this.fullMoves;
    }

    public getPieceAtIndex(index: number): Piece {
        if (index < 0 || index > 63) return new Piece();

        return Piece.fromInt(this.board[index], index);
    }

    public getLegalMoves(piece: Piece) {
        let legalMoves: Array<number> = [];

        let position = piece.getPosition()

        switch (piece.getType()) {
            case Pieces.PAWN:
                let direction = piece.getColor() === Players.WHITE ? -1 : 1;

                // Check if the pawn can move forward one square
                if (this.pieceLookupTable[position + 8 * direction].getType() == Pieces.NONE) {
                    legalMoves.push(position + 8 * direction);
                }

                // Check if the pawn is in it's starting position/can move forward two squares
                if (
                    (piece.getColor() == Players.WHITE && position >= 48 && position <= 55) ||
                    (piece.getColor() == Players.BLACK && position >= 8 && position <= 15)
                ) {
                    if (
                        this.board[position + 16 * direction].getType() == Pieces.NONE &&
                        this.board[position + 8 * direction].getType() == Pieces.NONE
                    ) {
                        legalMoves.push(position + 16 * direction);
                    }
                }

                // Check if the pawn can capture pieces diagonally
                if (
                    position % 8 != 7 &&
                    this.board[position + 7 * direction].getType() != Pieces.NONE &&
                    this.board[position + 7 * direction].getColor() != piece.getColor()
                ) {
                    legalMoves.push(position + 7 * direction);
                }

                if (
                    position % 8 != 0 &&
                    this.board[position + 9 * direction].getType() != Pieces.NONE &&
                    this.board[position + 9 * direction].getColor() != piece.getColor()
                ) {
                    legalMoves.push(position + 9 * direction);
                }
                break;
            case Pieces.QUEEN:
                this.calculateDiagonalLines(legalMoves, position, piece);
                this.calculateHorizontalLines(legalMoves, position, piece);
                break;
            case Pieces.ROOK:
                this.calculateHorizontalLines(legalMoves, position, piece);
                break;
            case Pieces.BISHOP:
                this.calculateDiagonalLines(legalMoves, position, piece);
                break;
            case Pieces.KNIGHT:
                for (let i = -2; i <= 2; i++) {
                    for (let j = -2; j <= 2; j++) {
                        if (Math.abs(i) + Math.abs(j) == 3) {
                            let cellIndex = position + i * 8 + j;

                            if (cellIndex < 0 || cellIndex > 63) {
                                continue;
                            }

                            if (
                                (position % 8 == 0 && j == -2) ||
                                (position % 8 == 1 && j == -1) ||
                                (position % 8 == 6 && j == 1) ||
                                (position % 8 == 7 && j == 2)
                            ) {
                                continue;
                            }

                            if (this.board[cellIndex].getColor() != piece.getColor()) {
                                legalMoves.push(cellIndex);
                            }
                        }
                    }
                }
                break;
            case Pieces.KING:
                for (let i = -1; i <= 1; i++) {
                    for (let j = -1; j <= 1; j++) {
                        let cellIndex = position + i * 8 + j;

                        if (cellIndex < 0 || cellIndex > 63) {
                            continue;
                        }

                        if (
                            (position % 8 == 0 && j == -1) ||
                            (position % 8 == 7 && j == 1)
                        ) {
                            continue;
                        }

                        if (this.board[cellIndex].getColor() != piece.getColor()) {
                            legalMoves.push(cellIndex);
                        }
                    }
                }
                break;
            default:
                return legalMoves;
        }

        return legalMoves;
    }

    private calculateDiagonalLines(legalMoves: number[], index: number, piece: Piece) {
        this.calculateMovementLine(legalMoves, index, [1, 1], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [-1, -1], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [1, -1], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [-1, 1], piece.getColor());
    }

    private calculateHorizontalLines(legalMoves: number[], index: number, piece: Piece) {
        this.calculateMovementLine(legalMoves, index, [0, 1], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [0, -1], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [1, 0], piece.getColor());
        this.calculateMovementLine(legalMoves, index, [-1, 0], piece.getColor());
    }

    private calculateMovementLine(
        legalMoves: number[],
        index: number,
        direction: number[],
        color: any,
    ): number[] {

        // Check if we are on the side of the board
        if (
            (index % 8 == 0 && direction[1] == -1) ||
            (index % 8 == 7 && direction[1] == 1)
        )
            return legalMoves;

        index += direction[0] * 8 + direction[1];

        // Cap index to the board limits
        if (index < 0 || index > 63) {
            return legalMoves;
        }

        let currentPiece = this.board[index];

        if (currentPiece.getColor() == color) {
            return legalMoves; // If the color of the piece we ran into is the same as the piece that we are checking movement for, return
        } else if (
            currentPiece.getType() != Pieces.NONE ||
            (index % 8 == 0 && direction[1] == -1) ||
            (index % 8 == 7 && direction[1] == 1)
        ) {
            legalMoves.push(index);
            return legalMoves; // If the color is opposite, add the piece to capturable pieces and then return
        } else {
            legalMoves.push(index);
            return this.calculateMovementLine(
                legalMoves,
                index,
                direction,
                color,
            ); // Call this function recursively
        }
    }

    private refreshPieceList() {
        this.pieceList = [];

        for (const [index, square] of this.board.entries()) {
            if (square != Pieces.NONE) {
                this.pieceList.push(Piece.fromInt(square, index, index))
            }
        }
    }

    private calculatePositionBitboards() {
        for (const piece of this.pieceList) {
            if (piece.getColor() == Players.WHITE) {
                this.whiteBoard |= 1n << BigInt(piece.getPosition());
            } else {
                this.blackBoard |= 1n << BigInt(piece.getPosition());
            }

            switch (piece.getType()) {
                case (PieceTypes.PAWN):
                    this.pawnBoard |= 1n << BigInt(piece.getPosition());
                    break;
                case (PieceTypes.ROOK):
                    this.rookBoard |= 1n << BigInt(piece.getPosition());
                    break;
                case (PieceTypes.BISHOP):
                    this.bishopBoard |= 1n << BigInt(piece.getPosition());
                    break;
                case (PieceTypes.KNIGHT):
                    this.knightBoard |= 1n << BigInt(piece.getPosition());
                    break;
                case (PieceTypes.KING):
                    this.kingBoard |= 1n << BigInt(piece.getPosition());
                    break;
                case (PieceTypes.QUEEN):
                    this.queenBoard |= 1n << BigInt(piece.getPosition());
                    break;
            }
        }
    }

    static squareToIndex(square: string): number {
        if (!ChessBoard.littleEndianRegex.test(square)) return -1; // Return an error if the string provided does not have a valid notated square

        let trimString = square.trim();

        return (
            (trimString.charCodeAt(1) - 49) * 8 + (trimString.charCodeAt(0) - 97)
        ); // 49 = 1, 97 = a
    }

    static indexToSquare(index: number): string {
        return String.fromCharCode(97 + (index % 8)) + (8 - Math.floor(index / 8))
    }
}

export class CastleRights {
    whiteKingside: boolean = false;
    whiteQueenside: boolean = false;
    blackKingside: boolean = false;
    blackQueenside: boolean = false;

    public constructor(castleString: string) {
        for (const char of castleString) {
            switch (char) {
                case "Q":
                    this.whiteQueenside = true;
                    break;
                case "K":
                    this.whiteKingside = true;
                    break;
                case "q":
                    this.blackQueenside = true;
                    break;
                case "k":
                    this.blackKingside = true;
                    break;
            }
        }
    }
}
import { Bitboard } from "./bitboard";
import { Piece } from "./chessPiece";
import { directionOffsets, knightJumpOffsets, littleEndianRegex, Pieces, PieceTypes, Players } from "./chessUtils";
import { Move } from "./moveGenerator";

export class ChessBoard {
    private board: Pieces[];
    private activePlayer: Players = Players.WHITE;
    private castleRights: CastleRights;
    private enPassantindex: number;
    private halfMoveClock: number;
    private fullMoves: number;

    private pieceList: Piece[] = [];

    private whiteBoard: Bitboard = new Bitboard(0n);
    private blackBoard: Bitboard = new Bitboard(0n);
    private pawnBoard: Bitboard = new Bitboard(0n);
    private knightBoard: Bitboard = new Bitboard(0n);
    private rookBoard: Bitboard = new Bitboard(0n);
    private bishopBoard: Bitboard = new Bitboard(0n);
    private queenBoard: Bitboard = new Bitboard(0n);
    private kingBoard: Bitboard = new Bitboard(0n);

    private boardUpdateCallbacks: Array<() => void> = [];

    public constructor(
        board: Pieces[],
        activePlayer: Players,
        castleRights: CastleRights,
        enPassantindex: number,
        halfMoveClock: number,
        fullMoves: number
    ) {
        this.board = board;
        this.activePlayer = activePlayer;
        this.castleRights = castleRights;
        this.enPassantindex = enPassantindex;
        this.halfMoveClock = halfMoveClock;
        this.fullMoves = fullMoves;
        this.refreshBoard();
    }

    public makeMove(move: Move): boolean {
        const startSquare: number = move.getStartSquare();
        const endSquare: number = move.getEndSquare();

        // Remove the captured piece if it's being captured
        if (move.checkIsCapture()) {
            this.removePieceAtIndex(endSquare);
        }

        // Update the piece's position in the pieceList
        const pieceToMove: Piece = this.getPieceAtIndex(startSquare)
        pieceToMove.changePosition(endSquare)

        // Update the 8x8
        this.board[endSquare] = this.board[startSquare];
        this.board[startSquare] = Pieces.NONE;

        // Swap active player
        this.activePlayer = this.activePlayer == Players.WHITE ? Players.BLACK : Players.WHITE;

        this.updateBoard();
        console.log(this.pieceList)
        return true;
    }

    public unmakeMove(move: Move): boolean {

        this.updateBoard();
        return false;
    }

    public getBoard(): Pieces[] {
        return this.board;
    }

    public getPieces(): Piece[] {
        return this.pieceList;
    }

    public updateBoard() {
        console.log("Updating board");
        this.updatePositionBitboards();

        // Send any update callbacks as necessary
        for (const func of this.boardUpdateCallbacks) {
            func.call(self);
        }
    }

    public refreshBoard() {
        this.refreshPieceList();
        this.updateBoard();
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

    public addBoardUpdateCallback(callback: () => void) {
        this.boardUpdateCallbacks.push(callback);
    }

    public getBoardUpdateCallbacks(): Array<() => void> {
        return this.boardUpdateCallbacks;
    }

    public removeBoardUpdateCallback(callback: () => void): boolean {
        return false;
    }

    public getPiecePositionBitboard(piece: PieceTypes | Pieces = Pieces.NONE): Bitboard {
        if (piece in PieceTypes) {
            switch(piece) {
                case(PieceTypes.BISHOP):
                    return this.bishopBoard;
                case(PieceTypes.ROOK):
                    return this.rookBoard;
                case(PieceTypes.KNIGHT):
                    return this.knightBoard;
                case(PieceTypes.KING):
                    return this.kingBoard;
                case(PieceTypes.QUEEN):
                    return this.queenBoard;
                case(PieceTypes.PAWN):
                    return this.pawnBoard;
            }
        } else {
            switch(piece) {
                case(Pieces.WHITE_BISHOP):
                    return this.bishopBoard.and(this.whiteBoard);
                case(Pieces.WHITE_ROOK):
                    return this.rookBoard.and(this.whiteBoard);
                case(Pieces.WHITE_KNIGHT):
                    return this.knightBoard.and(this.whiteBoard);
                case(Pieces.WHITE_KING):
                    return this.kingBoard.and(this.whiteBoard);
                case(Pieces.WHITE_QUEEN):
                    return this.queenBoard.and(this.whiteBoard);
                case(Pieces.WHITE_PAWN):
                    return this.pawnBoard.and(this.whiteBoard);
                case(Pieces.BLACK_BISHOP):
                    return this.bishopBoard.and(this.blackBoard);
                case(Pieces.BLACK_ROOK):
                    return this.rookBoard.and(this.blackBoard);
                case(Pieces.BLACK_KNIGHT):
                    return this.knightBoard.and(this.blackBoard);
                case(Pieces.BLACK_KING):
                    return this.kingBoard.and(this.blackBoard);
                case(Pieces.BLACK_QUEEN):
                    return this.queenBoard.and(this.blackBoard);
                case(Pieces.BLACK_PAWN):
                    return this.pawnBoard.and(this.blackBoard);
            }
        }

        return this.pawnBoard.or(this.bishopBoard).or(this.rookBoard).or(this.knightBoard).or(this.kingBoard).or(this.queenBoard);
    }

    public getColorPositionBitboard(color: Players): Bitboard {
        if (color == Players.WHITE)
            return this.whiteBoard;
        else
            return this.blackBoard;
    }

    public getPieceAtIndex(index: number): Piece {
        // Check if there is a piece at the index provided
        if (!this.hasPieceAtIndex(index))
            return new Piece();

        let cachedPiece = this.pieceList.find((value: Piece) => value.getPosition() == index);

        // If the piece already exists in our pieceList, return that instead of creating a new one
        if (cachedPiece instanceof Piece) {
            return cachedPiece;
        }

        // Otherwise create a new piece and add that to the pieceList for future reference
        let newPiece: Piece = Piece.fromInt(this.board[index], index, index)
        this.pieceList.push(newPiece)

        return newPiece;
    }

    public addPiece(piece: Pieces, index: number): boolean {
        // Make sure we don't add a piece in a position that already has one
        if (this.hasPieceAtIndex(index)) return false;

        let newPiece: Piece = Piece.fromInt(piece, index, index);
        this.pieceList.push(newPiece);
        this.board[index] = piece;

        this.updateBoard();
        return true;
    }

    public removePieceAtIndex(index: number): Pieces {
        this.pieceList = this.pieceList.filter((value: Piece) => value.getPosition() !== index);

        const oldPiece: Pieces = this.board[index];
        this.board[index] = Pieces.NONE;

        this.updateBoard();
        return oldPiece;
    }

    public hasPieceAtIndex(index: number): boolean {
        return this.board[index] !== Pieces.NONE;
    }

    private refreshPieceList() {
        this.pieceList = [];
        for (const [index, square] of this.board.entries()) {
            if (square != Pieces.NONE) {
                this.pieceList.push(Piece.fromInt(square, index, index))
            }
        }
    }

    private updatePositionBitboards() {
        this.whiteBoard.clear();
        this.blackBoard.clear();
        this.pawnBoard.clear();
        this.rookBoard.clear();
        this.bishopBoard.clear();
        this.knightBoard.clear();
        this.queenBoard.clear();
        this.kingBoard.clear();

        for (const piece of this.pieceList) {
            if (piece.getColor() == Players.WHITE) {
                this.whiteBoard.setBit(piece.getPosition());
            } else {
                this.blackBoard.setBit(piece.getPosition());
            }

            switch (piece.getType()) {
                case (PieceTypes.PAWN):
                    this.pawnBoard.setBit(piece.getPosition());
                    break;
                case (PieceTypes.ROOK):
                    this.rookBoard.setBit(piece.getPosition());
                    break;
                case (PieceTypes.BISHOP):
                    this.bishopBoard.setBit(piece.getPosition());
                    break;
                case (PieceTypes.KNIGHT):
                    this.knightBoard.setBit(piece.getPosition());
                    break;
                case (PieceTypes.KING):
                    this.kingBoard.setBit(piece.getPosition());
                    break;
                case (PieceTypes.QUEEN):
                    this.queenBoard.setBit(piece.getPosition());
                    break;
            }
        }
    }

    static squareToIndex(square: string): number {
        if (!littleEndianRegex.test(square)) return -1; // Return an error if the string provided does not have a valid notated square

        let trimString = square.trim();

        return (parseInt(trimString[1]) * 8 + (trimString.charCodeAt(0) - 'a'.charCodeAt(0)));
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
import { Bitboard } from "./bitboard";
import { Piece } from "./chessPiece";
import {
    boardSquares,
    directionOffsets,
    knightJumpOffsets,
    littleEndianRegex,
    Pieces,
    PieceTypes,
    Players,
    startingBoardPosition,
} from "./chessUtils";
import { FEN } from "./FEN";
import { Move } from "./moveGenerator";

export class ChessBoard {
    private board: Pieces[];
    private activePlayer: Players;
    private gameState: GameState;
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

    private gameHistory: {move: Move, gamestate: GameState}[] = [];

    public constructor(
        board: Pieces[] = [],
        activePlayer: Players = Players.NONE,
        gameState: GameState = new GameState(),
        fullMoves: number = 0,
    ) {
        this.board = board;
        this.activePlayer = activePlayer;
        this.gameState = gameState;
        this.fullMoves = fullMoves;
        this.refreshBoard();
        this.gameHistory.push({move: new Move(0, 0, false), gamestate: this.gameState});
    }

    public makeMove(move: Move): boolean {
        const startSquare: number = move.getStartSquare();
        const endSquare: number = move.getEndSquare();

        let capturedPiece: Pieces = Pieces.NONE;
        let halfMoveClock = this.gameState.getHalfMoveClock() + 1;
        let enPassantIndex = -1;
        const castleRights: CastleRights = this.gameState.getCastleRights();

        // Remove the captured piece if it's being captured
        if (move.checkIsCapture()) {
            capturedPiece = this.removePieceAtIndex(endSquare);
        }

        // Update the piece's position in the pieceList
        const pieceToMove: Piece = this.getPieceAtIndex(startSquare);
        pieceToMove.changePosition(endSquare);

        // Update the 8x8
        this.board[endSquare] = this.board[startSquare];
        this.board[startSquare] = Pieces.NONE;

        // Swap active player
        this.activePlayer = this.activePlayer == Players.WHITE ? Players.BLACK : Players.WHITE;

        // Check if we need to reset the half move clock
        if (pieceToMove.getType() == PieceTypes.PAWN || capturedPiece != Pieces.NONE) {
            halfMoveClock = 0;
        }

        // Check if the pawn has moved forward twice
        // if () {
        //     enPassantIndex = startSquare
        // }

        // Check if we need to remove castle rights
        if (castleRights.getRaw().getBoard() != 0n) {
            if (startSquare == boardSquares.h1 || endSquare == boardSquares.h1) {
                castleRights.getRaw().setBit(1, false);
            } else if (startSquare == boardSquares.a1 || endSquare == boardSquares.a1) {
                castleRights.getRaw().setBit(0, false);
            } else if (startSquare == boardSquares.h8 || endSquare == boardSquares.h8) {
                castleRights.getRaw().setBit(3, false);
            } else if (startSquare == boardSquares.a8 || endSquare == boardSquares.a8) {
                castleRights.getRaw().setBit(2, false);
            }
        }

        const newGameState: GameState = new GameState(capturedPiece, enPassantIndex, castleRights, halfMoveClock);

        // Update everything
        this.updateBoard();
        this.fullMoves++;
        this.gameHistory.push({move: move, gamestate: newGameState});
        this.gameState = newGameState;
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
        return this.gameState.getEnPassantIndex() >= 0;
    }

    public getGameState(): GameState {
        return this.gameState;
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

    public getPiecePositionBitboard(
        piece: PieceTypes | Pieces = Pieces.NONE,
    ): Bitboard {
        if (piece in PieceTypes) {
            switch (piece) {
                case PieceTypes.BISHOP:
                    return this.bishopBoard;
                case PieceTypes.ROOK:
                    return this.rookBoard;
                case PieceTypes.KNIGHT:
                    return this.knightBoard;
                case PieceTypes.KING:
                    return this.kingBoard;
                case PieceTypes.QUEEN:
                    return this.queenBoard;
                case PieceTypes.PAWN:
                    return this.pawnBoard;
            }
        } else {
            switch (piece) {
                case Pieces.WHITE_BISHOP:
                    return this.bishopBoard.and(this.whiteBoard);
                case Pieces.WHITE_ROOK:
                    return this.rookBoard.and(this.whiteBoard);
                case Pieces.WHITE_KNIGHT:
                    return this.knightBoard.and(this.whiteBoard);
                case Pieces.WHITE_KING:
                    return this.kingBoard.and(this.whiteBoard);
                case Pieces.WHITE_QUEEN:
                    return this.queenBoard.and(this.whiteBoard);
                case Pieces.WHITE_PAWN:
                    return this.pawnBoard.and(this.whiteBoard);
                case Pieces.BLACK_BISHOP:
                    return this.bishopBoard.and(this.blackBoard);
                case Pieces.BLACK_ROOK:
                    return this.rookBoard.and(this.blackBoard);
                case Pieces.BLACK_KNIGHT:
                    return this.knightBoard.and(this.blackBoard);
                case Pieces.BLACK_KING:
                    return this.kingBoard.and(this.blackBoard);
                case Pieces.BLACK_QUEEN:
                    return this.queenBoard.and(this.blackBoard);
                case Pieces.BLACK_PAWN:
                    return this.pawnBoard.and(this.blackBoard);
            }
        }

        return this.pawnBoard
            .or(this.bishopBoard)
            .or(this.rookBoard)
            .or(this.knightBoard)
            .or(this.kingBoard)
            .or(this.queenBoard);
    }

    public getColorPositionBitboard(color: Players): Bitboard {
        if (color == Players.WHITE) return this.whiteBoard;
        else return this.blackBoard;
    }

    public getPieceAtIndex(index: number): Piece {
        // Check if there is a piece at the index provided
        if (!this.hasPieceAtIndex(index)) return new Piece();

        let cachedPiece = this.pieceList.find(
            (value: Piece) => value.getPosition() == index,
        );

        // If the piece already exists in our pieceList, return that instead of creating a new one
        if (cachedPiece instanceof Piece) {
            return cachedPiece;
        }

        // Otherwise create a new piece and add that to the pieceList for future reference
        let newPiece: Piece = Piece.fromInt(this.board[index], index, index);
        this.pieceList.push(newPiece);

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
        this.pieceList = this.pieceList.filter(
            (value: Piece) => value.getPosition() !== index,
        );

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
                this.pieceList.push(Piece.fromInt(square, index, index));
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
                case PieceTypes.PAWN:
                    this.pawnBoard.setBit(piece.getPosition());
                    break;
                case PieceTypes.ROOK:
                    this.rookBoard.setBit(piece.getPosition());
                    break;
                case PieceTypes.BISHOP:
                    this.bishopBoard.setBit(piece.getPosition());
                    break;
                case PieceTypes.KNIGHT:
                    this.knightBoard.setBit(piece.getPosition());
                    break;
                case PieceTypes.KING:
                    this.kingBoard.setBit(piece.getPosition());
                    break;
                case PieceTypes.QUEEN:
                    this.queenBoard.setBit(piece.getPosition());
                    break;
            }
        }
    }

    static squareToIndex(square: string): number {
        if (!littleEndianRegex.test(square)) return -1; // Return an error if the string provided does not have a valid notated square

        let trimString = square.trim();

        return (
            parseInt(trimString[1]) * 8 +
            (trimString.charCodeAt(0) - "a".charCodeAt(0))
        );
    }

    static indexToSquare(index: number): string {
        if (index < 0) return "-"

        return (
            String.fromCharCode(97 + (index % 8)) + (8 - Math.floor(index / 8))
        );
    }

    static startingPosition(): ChessBoard {
        return FEN.interpret(startingBoardPosition);
    }
}

export class GameState {
    public constructor(
        private capturedPiece: Pieces = Pieces.NONE,
        private enPassantIndex: number = -1,
        private castleRights: CastleRights = new CastleRights(""),
        private halfMoveClock: number = 0
    ) {}

    public getCapturedPiece(): Pieces {
        return this.capturedPiece;
    }

    public getEnPassantIndex(): number {
        return this.enPassantIndex;
    }

    public getCastleRights(): CastleRights {
        return this.castleRights;
    }

    public getHalfMoveClock(): number {
        return this.halfMoveClock;
    }
}

export class CastleRights {
    private castleRightsBoard = new Bitboard();

    public constructor(castleString: string) {
        for (const char of castleString) {
            switch (char) {
                case "Q":
                    this.castleRightsBoard = this.castleRightsBoard.or(0b1n);
                    break;
                case "K":
                    this.castleRightsBoard = this.castleRightsBoard.or(0b10n);
                    break;
                case "q":
                    this.castleRightsBoard = this.castleRightsBoard.or(0b100n);
                    break;
                case "k":
                    this.castleRightsBoard = this.castleRightsBoard.or(0b1000n);
                    break;
            }
        }
    }

    public getRaw(): Bitboard {
        return this.castleRightsBoard;
    }

    public canKingsideCastle(color: Players): boolean {
        const mask: bigint = color == Players.WHITE ? 2n : 8n;
        return this.castleRightsBoard.and(mask).getBoard() != 0n;
    }

    public canQueensideCastle(color: Players): boolean {
        const mask = color == Players.WHITE ? 1n : 4n;
        return this.castleRightsBoard.and(mask).getBoard() != 0n;
    }

    public getAsString(): string {
        let str = "";

        // If there are no valid castle rights then return a dash
        if (this.castleRightsBoard.getBoard() == 0n)
            return "-"

        if (this.castleRightsBoard.getBit(1))
            str += "K"

        if (this.castleRightsBoard.getBit(0))
            str += "Q"

        if (this.castleRightsBoard.getBit(3))
            str += "k"

        if (this.castleRightsBoard.getBit(2))
            str += "q"
        
        return str;
    }
}

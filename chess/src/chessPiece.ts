import { Pieces, PieceTypes, Players } from "./chessUtils";

export class Piece {
    private position: number;
    private color: Players;
    private pieceType: PieceTypes;
    private pieceID: number;

    public constructor(
        pieceType: PieceTypes = PieceTypes.NONE,
        position: number = -1,
        color: Players = Players.NONE,
        pieceID: number = 0
    ) {
        this.position = position;
        this.color = color;
        this.pieceType = pieceType;
        this.pieceID = pieceID;
    }

    public getPosition(): number {
        return this.position;
    }

    public getID(): number {
        return this.pieceID;
    }

    public getColor(): Players {
        return this.color;
    }

    public getType(): PieceTypes {
        return this.pieceType;
    }

    public getAsInt(): Pieces {
        return this.pieceType + this.color;
    }

    static pieceTypeFromLetter(letter: string): PieceTypes {
        switch(letter.toLowerCase()) {
            case("p"):
                return PieceTypes.PAWN;
            case("n"):
                return PieceTypes.KNIGHT;
            case("b"):
                return PieceTypes.BISHOP;
            case("r"):
                return PieceTypes.ROOK;
            case("k"):
                return PieceTypes.KING;
            case("q"):
                return PieceTypes.QUEEN;
            default:
                return PieceTypes.NONE;
        }
    }

    static pieceFromLetter(letter: string): Pieces {
        if (letter == letter.toUpperCase())
            return Piece.pieceTypeFromLetter(letter) as number;
        return Piece.pieceTypeFromLetter(letter) + Players.BLACK;
    }

    static fromInt(piece: Pieces, position: number, pieceID: number = 0): Piece {
        if (piece > Players.BLACK)
            return new Piece(piece - Players.BLACK, position, Players.BLACK, pieceID)
        else
            return new Piece(piece.valueOf(), position, Players.WHITE, pieceID)
    }
}
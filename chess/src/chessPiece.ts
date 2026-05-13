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

    public changePosition(index: number) {
        this.position = index;
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

    public isRealPiece(): boolean {
        return this.pieceType !== PieceTypes.NONE;
    }

    public getAsLetter(): string {
        let letter: string = "";
        switch(this.pieceType) {
            case(PieceTypes.PAWN):
                letter = "p";
                break;
            case(PieceTypes.KNIGHT):
                letter = "n";
                break;
            case(PieceTypes.BISHOP):
                letter = "b";
                break;
            case(PieceTypes.ROOK):
                letter = "r";
                break;
            case(PieceTypes.KING):
                letter = "k";
                break;
            case(PieceTypes.QUEEN):
                letter = "q";
                break;
            default:
                letter = "-";
        }

        if (this.getColor() == Players.WHITE)
            letter = letter.toUpperCase();

        return letter
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

    static getColorFromInt(piece: Pieces): Players {
        if (piece > Players.BLACK)
            return Players.BLACK;
        return Players.WHITE;
    }

    static fromInt(piece: Pieces, position: number, pieceID: number = 0): Piece {
        const color: Players = this.getColorFromInt(piece);

        return new Piece(piece - color, position, color, pieceID)
    }
}
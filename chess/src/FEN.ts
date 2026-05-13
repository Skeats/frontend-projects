import { CastleRights, ChessBoard } from "./chessBoard";
import { Piece } from "./chessPiece";
import { Pieces, Players } from "./chessUtils";

export class FEN {
    static readonly fenRegex: RegExp = /^([1-8PNBRQK]{1,8}\/){7}[1-8PNBRQK]+ [wb-]{1} ([KQkq-]){1,4} ([a-h][1-8]|-)+ \d+ \d+$/gim;

    static interpret(fen: string): ChessBoard {
        const splitString = fen.split(" ");

        const boardState = splitString[0];
        const active = splitString[1];
        const castling = splitString[2];
        const enPassant = splitString[3];
        const halfMove = splitString[4];
        const fullMove = splitString[5];

        let pos: number = 0;
        let board: Array<Pieces> = new Array(64).fill(Pieces.NONE);

        for (const e of boardState) {
            let value = parseInt(e);

            if (isNaN(value) && e !== "/") {
                board[pos++] = Piece.pieceFromLetter(e);
            } else {
                for (let i = 0; i < value; i++) {
                    board[pos++] = Pieces.NONE;
                }
            }
        }

        return new ChessBoard(
            board,
            active == "w" ? Players.WHITE : Players.BLACK,
            new CastleRights(castling),
            ChessBoard.squareToIndex(enPassant),
            +halfMove,
            +fullMove,
        );
    }

    // Important note: This is not a comprehensive FEN validator, it will not check, for example, the validity of a file (ensuring there are exactly 8 defined squares)
    static isValid(fen: string): boolean {
        return this.fenRegex.test(fen);
    }
}
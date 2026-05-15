import { ChessBoard } from "./chessBoard";

export class PGN {
    public static interpret(pgn: string): ChessBoard {
        return new ChessBoard();
    }

    public static generate(board: ChessBoard): string {
        return "";
    }

    public static isValidPGN(pgn: string): boolean {
        return false;
    }
}

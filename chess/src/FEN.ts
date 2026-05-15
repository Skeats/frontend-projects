import { CastleRights, ChessBoard, GameState } from "./chessBoard";
import { Piece } from "./chessPiece";
import { Pieces, Players } from "./chessUtils";

export class FEN {
    static readonly fenRegex: RegExp =
        /^([1-8PNBRQK]{1,8}\/){7}[1-8PNBRQK]+ [wb-]{1} ([KQkq-]){1,4} ([a-h][1-8]|-)+ \d+ \d+$/gim;

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
            new GameState(
                Pieces.NONE,
                ChessBoard.squareToIndex(enPassant),
                new CastleRights(castling),
                +halfMove,
            ),
            +fullMove,
        );
    }

    static generate(board: ChessBoard): string {
        let fen: string = "";

        // Generate the board state FEN from the chessboard
        let emptySquareCount: number = 0;
        for (const [index, square] of board.getBoard().entries()) {
            // if we have reached the end of a row, add a slash
            if (index % 8 == 0 && index > 0) {
                addEmptySquareCount();
                fen += "/";
            }

            // If we have a series of empty squares, count them up
            if (square == Pieces.NONE) {
                emptySquareCount++;
                continue;
            }

            addEmptySquareCount();

            fen += Piece.fromInt(square, index).getAsLetter();
        }

        // Add the active player
        fen += board.getActivePlayer() == Players.WHITE ? " w" : " b";

        // Add the castle rights
        fen += " " + board.getGameState().getCastleRights().getAsString();

        // Add  the enPassant square
        fen += " " + ChessBoard.indexToSquare(board.getGameState().getEnPassantIndex());

        fen += " " + board.getGameState().getHalfMoveClock().toString();

        fen += " " + board.getFullMoves().toString();

        return fen;

        function addEmptySquareCount() {
            // If we have reached the end of a series of empty squares, then add the number of empty squares to the fen string
            if (emptySquareCount > 0) {
                fen += emptySquareCount.toString();
                emptySquareCount = 0;
            }
        }
    }

    // Important note: This is not a comprehensive FEN validator, it will not check, for example, the validity of a file (ensuring there are exactly 8 defined squares)
    static isValid(fen: string): boolean {
        return this.fenRegex.test(fen);
    }
}

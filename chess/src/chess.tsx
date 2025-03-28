import { act, MouseEventHandler, useState } from 'react';
import './chess.css';

// Enum for pieces and sides
enum Pieces {
    NONE = "empty",
    KING = "K",
    QUEEN = "Q",
    BISHOP = "B",
    KNIGHT = "N",
    ROOK = "R",
    PAWN = "P"
}

enum Players {
    NONE = "empty",
    WHITE = "w",
    BLACK = "b"
}

enum LittleEndianNotation {
    a8, b8, c8, d8, e8, f8, g8, h8,
    a7, b7, c7, d7, e7, f7, g7, h7,
    a6, b6, c6, d6, e6, f6, g6, h6,
    a5, b5, c5, d5, e5, f5, g5, h5,
    a4, b4, c4, d4, e4, f4, g4, h4,
    a3, b3, c3, d3, e3, f3, g3, h3,
    a2, b2, c2, d2, e2, f2, g2, h2,
    a1, b1, c1, d1, e1, f1, g1, h1
}

const startingBoardPosition: string = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1";
const testPosition: string = "q2pP2q/8/8/r6R/b2kK2B/8/8/Q2pP2Q w - - 0 1"

// Exported component
export function Chess() {
    let [activePlayer, setActivePlayer] = useState<Players>(Players.WHITE);
    let [moveHistory, setMoveHistory] = useState<Array<string>>([]);

    return (
    <div className="chess-game">
      <Board activePlayer={activePlayer} flipActivePlayer={() => setActivePlayer(activePlayer == Players.WHITE ? Players.BLACK : Players.WHITE)} />
    </div>
  );
}

function Board({ activePlayer, flipActivePlayer }: { activePlayer: Players, flipActivePlayer: Function }) {
    let [board, setBoard] = useState<Array<Array<Players | Pieces>>>(FENInterpreter(startingBoardPosition));

    let [heldPiece, setHeldPiece] = useState<Array<Players | Pieces>>([Players.NONE, Pieces.NONE]);
    let [heldPieceIndex, setHeldPieceIndex] = useState<number>(-1);
    let [lastMove, setLastMove] = useState<Array<number>>([]);
    let [legalMoves, setLegalMoves] = useState<Array<number>>([]);

    // Handles the mouse interaction with pieces on the board
    function handleClickEvent(index: number) {

        // If no piece is held, and the clicked square is not empty, pick up the piece
        if (heldPiece[1] == Pieces.NONE || board[index][0] == activePlayer) {
            if (board[index][1] != Pieces.NONE && board[index][0] == activePlayer) {
                // Pick up piece
                console.log("Picking up " + board[index] + " at " + index);
                setHeldPiece(board[index]);
                setHeldPieceIndex(index);
                setLegalMoves(calculateLegalMoves(board[index], index, board));
            }
        } else { // Otherwise check if the piece can be placed at the clicked square

            // Check if the index is a legal move, and there are no pieces in the way
            if (legalMoves.includes(index)) {

                // Creates a new updated board, and sets the current board to it
                let newBoard = board.slice();
                newBoard[index] = heldPiece;
                newBoard[heldPieceIndex] = [Players.NONE, Pieces.NONE];
                setBoard(newBoard);
                setLastMove([heldPieceIndex, index]);

                flipActivePlayer();

                console.log("Moving " + heldPiece + " from " + heldPieceIndex + " to " + index);
            } else {
                console.log("Illegal move");
            }

            // Resets the held piece and index
            setHeldPiece([Players.NONE, Pieces.NONE]);
            setHeldPieceIndex(-1);
            setLegalMoves([]);
        }
    }

    return (
        <div className="chess-board">
        {board.map((value: Array<Players | Pieces>, index: number) => (
            <Square
                classes={
                    (((((Math.floor(index / 8)) % 2 == 0) == (index % 2 == 0))) ? 'WHITE' : 'BLACK') + " " +
                    (index == heldPieceIndex || heldPieceIndex < 0 && lastMove[0] == index? "held-tile" : "") + " " +
                    (heldPieceIndex < 0 && index == lastMove[1] ? "last-move-tile" : "")
                }
                index={index}
                piece={value}
                onClick={() => handleClickEvent(index)}
                highlight={legalMoves.includes(index) ? "moveable-tile" : ""}
            />
        ))}
        </div>
    );
}

function Square({ classes, index, piece, onClick, highlight }: { classes: string, index: number, piece: Array<Players | Pieces>, onClick: MouseEventHandler, highlight: string }) {
    return (
        <div className={`chess-square ${classes}`} key={index} id={index.toString()}>
            <div className={`highlighter ${highlight}`} />
            <Piece piece={piece} onClick={onClick}/>
        </div>
    );
}

function Piece({ piece, onClick }: { piece: Array<Players | Pieces>, onClick: MouseEventHandler }) {
    return <div
                className={`chess-piece side-${piece[0]} sprite-${piece[1]}`}
                onClick={onClick}
            />;
}

function calculateLegalMoves(piece: Array<Players | Pieces>, index: number, board: Array<Array<Players | Pieces>>) {
    let legalMoves: Array<number> = [];

    switch (piece[1]) {
        case Pieces.PAWN:
            let direction = piece[0] === Players.WHITE ? -1 : 1;

            // Check if the pawn can move forward one square
            if (board[index + 8 * direction][1] == Pieces.NONE) {
                legalMoves.push(index + 8 * direction);
            }

            // Check if the pawn is in it's starting position/can move forward two squares
            if (piece[0] == Players.WHITE && index >= 48 && index <= 55 || piece[0] == Players.BLACK && index >= 8 && index <= 15) {
                if (board[index + 16 * direction][1] == Pieces.NONE && board[index + 8 * direction][1] == Pieces.NONE) {
                    legalMoves.push(index + 16 * direction);
                }
            }

            // Check if the pawn can capture pieces diagonally
            if (index % 8 != 7 && board[index + 7 * direction][1] != Pieces.NONE && board[index + 7 * direction][0] != piece[0]) {
                legalMoves.push(index + 7 * direction);
            }

            if (index % 8 != 0 && board[index + 9 * direction][1] != Pieces.NONE && board[index + 9 * direction][0] != piece[0]) {
                legalMoves.push(index + 9 * direction);
            }
            break;
        case Pieces.QUEEN:
            calculateDiagonal();
            calculateHorizontal();
            break;
        case Pieces.ROOK:
            calculateHorizontal();
            break;
        case Pieces.BISHOP:
            calculateDiagonal();
            break;
        case Pieces.KNIGHT:
            for (let i = -2; i <= 2; i++) {
                for (let j = -2; j <= 2; j++) {
                    if (Math.abs(i) + Math.abs(j) == 3) {
                        let cellIndex = index + i * 8 + j;

                        if (cellIndex < 0 || cellIndex > 63) {
                            continue;
                        }

                        if (index % 8 == 0 && j == -2 || index % 8 == 1 && j == -1 || index % 8 == 6 && j == 1 || index % 8 == 7 && j == 2) {
                            continue;
                        }

                        if (board[cellIndex][0] != piece[0]) {
                            legalMoves.push(cellIndex);
                        }
                    }
                }
            }
            break;
        case Pieces.KING:
            for (let i = -1; i <= 1; i++) {
                for (let j = -1; j <= 1; j++) {
                    let cellIndex = index + i * 8 + j;

                    if (cellIndex < 0 || cellIndex > 63) {
                        continue;
                    }

                    if (index % 8 == 0 && j == -1 || index % 8 == 7 && j == 1) {
                        continue;
                    }

                    if (board[cellIndex][0] != piece[0]) {
                        legalMoves.push(cellIndex);
                    }
                }
            }
            break;
        default:
            return legalMoves;
    }

    return legalMoves;

    function calculateDiagonal() {
        calculateMovementLine(legalMoves, index, [1, 1], piece[0], board);
        calculateMovementLine(legalMoves, index, [-1, -1], piece[0], board);
        calculateMovementLine(legalMoves, index, [1, -1], piece[0], board);
        calculateMovementLine(legalMoves, index, [-1, 1], piece[0], board);
    }

    function calculateHorizontal() {
        calculateMovementLine(legalMoves, index, [0, 1], piece[0], board);
        calculateMovementLine(legalMoves, index, [0, -1], piece[0], board);
        calculateMovementLine(legalMoves, index, [1, 0], piece[0], board);
        calculateMovementLine(legalMoves, index, [-1, 0], piece[0], board);
    }
}

function calculateMovementLine(legalMoves: number[], index: number, direction: number[], color: any, board: Array<Array<Players | Pieces>>) {
    if ((index % 8 == 0 && direction[1] == -1) || (index % 8 == 7 && direction[1] == 1)) return legalMoves;
    
    index += direction[0] * 8 + direction[1];

    if (index < 0 || index > 63) {
        return legalMoves;
    }

    let currentPiece = board[index];

    if (currentPiece[0] == color) {
        return legalMoves;
    } else if (currentPiece[1] != Pieces.NONE || (index % 8 == 0 && direction[1] == -1) || (index % 8 == 7 && direction[1] == 1)) {
        legalMoves.push(index);
        return legalMoves;
    } else {
        legalMoves.push(index);
        return calculateMovementLine(legalMoves, index, direction, color, board);
    }
}

function FENInterpreter(fen: string) {
    const splitString = fen.split(" ");

    const board = splitString[0];
    const active = splitString[1];
    const castling = splitString[2];
    const enPassant = splitString[3];
    const halfMove = splitString[4];
    const fullMove = splitString[5];

    let pos: number = 0;
    let boardArray: Array<Array<Players | Pieces>> = new Array(64).fill([Players.NONE, Pieces.NONE]);

    for (const e of board) {
        let value = parseInt(e);

        if (isNaN(value) && e !== "/") {
            if (e == e.toUpperCase()) {
                boardArray[pos++] = [Players.WHITE, e as Pieces];
            } else {
                boardArray[pos++] = [Players.BLACK, e.toUpperCase() as Pieces];
            }
        } else {
            for (let i = 0; i < value; i++) {
                boardArray[pos++] = [Players.NONE, Pieces.NONE];
            }
        }
    }

    return boardArray;
}

function FENGenerator(board: Array<Array<number | string>>) {
    return board.map((row) => {
        return row.map((cell) => {
            if (typeof cell === 'number') {
                return cell;
            } else {
                return cell;
            }
        }).join('');
    }).join('/');
}
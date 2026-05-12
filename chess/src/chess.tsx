import { act, Dispatch, FormEventHandler, MouseEventHandler, SetStateAction, useRef, useState } from "react";
import "./chess.css";
import { ChessBoard } from "./chessBoard";
import { FEN } from "./FEN";
import { Piece } from "./chessPiece";

// Exported component
export function Chess() {
    let [chessBoard, setChessBoard] = useState<ChessBoard>(FEN.interpret(ChessBoard.startingBoardPosition));

    return (
        <div className="chess-game">
            <Board chessBoard={chessBoard} />
            <SideBar chessBoard={chessBoard} setChessBoard={setChessBoard}/>
        </div>
    );
}

function SideBar({
    chessBoard,
    setChessBoard
}: {
    chessBoard: ChessBoard
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>
}) {

    function onLoadGame(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = Object.fromEntries(new FormData(event.currentTarget).entries());

        console.log(data);
        if (data["notation-type"] == "fen" && FEN.isValid(data["game-string"] as string))
            setChessBoard(FEN.interpret(data["game-string"] as string));
    }

    return (
        <div className="chess-sidebar">
            <div>
                <form className="load-game-form" method="post" onSubmit={onLoadGame}>
                    <div className="game-input-field">
                        <textarea name="game-string" placeholder="Enter a FEN string" rows={8} cols={40}/>
                        <button type="submit">Load Game</button>
                    </div>
                    <div className="notation-picker">
                        <div className="radio-button">
                            <input type="radio" id="fen" name="notation-type" value={"fen"} defaultChecked />
                            <label htmlFor="fen">FEN</label>
                        </div>
                        <div className="radio-button">
                            <input type="radio" id="pgn" name="notation-type" value={"pgn"} disabled/>
                            <label htmlFor="pgn">PGN</label>
                        </div>
                    </div>
                </form>
            </div>
        </div>
    )
}

function Board({
    chessBoard
}: {
    chessBoard: ChessBoard
}) {
    // let [heldPiece, setHeldPiece] = useState<Piece>([
    //     Players.NONE,
    //     Pieces.NONE,
    // ]);
    // let [heldPieceIndex, setHeldPieceIndex] = useState<number>(-1);
    // let [lastMove, setLastMove] = useState<Array<number>>([]);
    // let [legalMoves, setLegalMoves] = useState<Array<number>>([]);

    // // Handles the mouse interaction with pieces on the board
    // function handleClickEvent(index: number) {
    //     // If no piece is held, and the clicked square is not empty, pick up the piece
    //     if (heldPiece[1] == Pieces.NONE || board[index][0] == activePlayer) {
    //         if (
    //             board[index][1] != Pieces.NONE &&
    //             board[index][0] == activePlayer
    //         ) {
    //             // Pick up piece
    //             console.log("Picking up " + board[index] + " at " + index);
    //             setHeldPiece(board[index]);
    //             setHeldPieceIndex(index);
    //             setLegalMoves(calculateLegalMoves(board[index], index, board));
    //         }
    //     } else {
    //         // Otherwise check if the piece can be placed at the clicked square

    //         // Check if the index is a legal move, and there are no pieces in the way
    //         if (legalMoves.includes(index)) {
    //             // Creates a new updated board, and sets the current board to it
    //             let newBoard = board.slice();
    //             newBoard[index] = heldPiece;
    //             newBoard[heldPieceIndex] = [Players.NONE, Pieces.NONE];
    //             setBoard(newBoard);
    //             setLastMove([heldPieceIndex, index]);

    //             flipActivePlayer();

    //             console.log(
    //                 "Moving " +
    //                     heldPiece +
    //                     " from " +
    //                     heldPieceIndex +
    //                     " to " +
    //                     index,
    //             );
    //         } else {
    //             console.log("Illegal move");
    //         }

    //         // Resets the held piece and index
    //         setHeldPiece([Players.NONE, Pieces.NONE]);
    //         setHeldPieceIndex(-1);
    //         setLegalMoves([]);
    //     }
    // }

    return (
        <div className="chess-board">
            {chessBoard.getPieces().map((value: Piece, index: number) => (
                <PieceSprite
                    key={value.getID()}
                    piece={value}
                    onClick={() => {}}
                />
            ))}
        </div>
    );
}

function Highlight({
    index,
    color
}: {
    index: number,
    color: string
}) {
    return (
        <div
            className={`chess-highlight square-${ChessBoard.indexToSquare(index)}`}
            style={{backgroundColor: color}}
        />
    )
}

function MoveHint({
    index
}: {
    index: number
}) {
    return (
        <div
            className={`chess-hint square-${ChessBoard.indexToSquare(index)}`}
        />
    )
}

function PieceSprite({
    piece,
    onClick
}: {
    piece: Piece,
    onClick: MouseEventHandler
}) {
    return (
        <div
            className={`chess-piece square-${ChessBoard.indexToSquare(piece.getPosition())} side-${piece.getColor()} sprite-${piece.getType()}`}
            onClick={onClick}
        />
    );
}

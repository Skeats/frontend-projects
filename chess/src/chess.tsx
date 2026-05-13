import {
    act,
    Dispatch,
    FormEventHandler,
    MouseEventHandler,
    SetStateAction,
    useRef,
    useState,
} from "react";
import "./chess.css";
import { ChessBoard } from "./chessBoard";
import { FEN } from "./FEN";
import { Piece } from "./chessPiece";
import { startingBoardPosition } from "./chessUtils";
import { generateMoves, Move } from "./moveGenerator";

enum ControlMode {
    PLAYER,
    ENGINE,
}

const highlightColorYellow = "#ffe7619a";
const highlightColorRed = "#ff2f2fa0";

// Exported component
export function Chess() {
    const [chessBoard, setChessBoard] = useState<ChessBoard>(
        FEN.interpret(startingBoardPosition),
    );
    const [whiteControlMode, setWhiteControlMode] = useState<ControlMode>(
        ControlMode.PLAYER,
    );
    const [blackControlMode, setBlackControlMode] = useState<ControlMode>(
        ControlMode.PLAYER,
    );

    chessBoard.addBoardUpdateCallback(() => setChessBoard(chessBoard));

    return (
        <div className="chess-game">
            <Board
                chessBoard={chessBoard}
                setChessBoard={setChessBoard}
                whiteControlMode={whiteControlMode}
                blackControlMode={blackControlMode}
            />
            <SideBar
                chessBoard={chessBoard}
                setChessBoard={setChessBoard}
                whiteControlMode={whiteControlMode}
                setWhiteControlMode={setWhiteControlMode}
                blackControlMode={blackControlMode}
                setBlackControlMode={setBlackControlMode}
            />
        </div>
    );
}

function SideBar({
    chessBoard,
    setChessBoard,
    whiteControlMode,
    setWhiteControlMode,
    blackControlMode,
    setBlackControlMode,
}: {
    chessBoard: ChessBoard;
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>;
    whiteControlMode: ControlMode;
    setWhiteControlMode: Dispatch<SetStateAction<ControlMode>>;
    blackControlMode: ControlMode;
    setBlackControlMode: Dispatch<SetStateAction<ControlMode>>;
}) {
    return (
        <div className="chess-sidebar">
            <LoadGameForm
                chessBoard={chessBoard}
                setChessBoard={setChessBoard}
            />
        </div>
    );
}

function GameSetupForm({
    chessBoard,
    setChessBoard,
    whiteControlMode,
    setWhiteControlMode,
    blackControlMode,
    setBlackControlMode,
}: {
    chessBoard: ChessBoard;
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>;
    whiteControlMode: ControlMode;
    setWhiteControlMode: Dispatch<SetStateAction<ControlMode>>;
    blackControlMode: ControlMode;
    setBlackControlMode: Dispatch<SetStateAction<ControlMode>>;
}) {

}

function LoadGameForm({
    chessBoard,
    setChessBoard,
}: {
    chessBoard: ChessBoard;
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>;
}) {
    function onLoadGame(event: React.SyntheticEvent<HTMLFormElement>) {
        event.preventDefault();
        const data = Object.fromEntries(
            new FormData(event.currentTarget).entries(),
        );

        // Trim whitespace for quality of life
        const cleanedString = data["game-string"].toString().trim();

        if (data["notation-type"] == "fen")
            if (FEN.isValid(cleanedString)) {
                setChessBoard(FEN.interpret(cleanedString));
                chessBoard.addBoardUpdateCallback(() =>
                    setChessBoard(chessBoard),
                );
            } else alert("Invalid FEN string given.");
        else alert("PGN Interpreting not yet implemented.");
    }

    return (
        <form className="load-game-form" method="post" onSubmit={onLoadGame}>
            <div className="game-input-field">
                <textarea
                    name="game-string"
                    placeholder="Enter a FEN/PGN string"
                    rows={8}
                    cols={40}
                />
                <button type="submit">Load Game</button>
            </div>
            <div className="notation-picker">
                <div className="radio-button">
                    <input
                        type="radio"
                        id="fen"
                        name="notation-type"
                        value={"fen"}
                        defaultChecked
                    />
                    <label htmlFor="fen">FEN</label>
                </div>
                <div className="radio-button">
                    <input
                        type="radio"
                        id="pgn"
                        name="notation-type"
                        value={"pgn"}
                    />
                    <label htmlFor="pgn">PGN</label>
                </div>
            </div>
        </form>
    );
}

function Board({
    chessBoard,
    setChessBoard,
    whiteControlMode,
    blackControlMode,
}: {
    chessBoard: ChessBoard;
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>;
    whiteControlMode: ControlMode;
    blackControlMode: ControlMode;
}) {
    const [highlights, setHighlights] = useState<Array<HighlightData>>([]);
    const [moveHints, setMoveHints] = useState<Array<Move>>([]);

    function onPieceClicked(index: number) {
        const moves: Array<Move> = generateMoves(chessBoard).filter((value: Move) => value.getStartSquare() == index);

        setMoveHints(moves);

        // Filter out old highlight squares and non-selection highlights
        let newHighlights = highlights.filter(
            (value: HighlightData) =>
                value.index != index &&
                value.type !== "piece-selection-highlight",
        );
        newHighlights.push({
            index: index,
            color: highlightColorYellow,
            type: "piece-selection-highlight",
        });
        setHighlights(newHighlights);
    }

    function onMoveHintClicked(move: Move) {
        chessBoard.makeMove(move);
        setMoveHints([]);

        // Filter out old highlight squares and non-selection highlights
        let newHighlights = highlights.filter(
            (value: HighlightData) =>
                (value.index !== move.getStartSquare()) &&
                (value.index !== move.getEndSquare()) &&
                (value.type !== "move-start-square") &&
                (value.type !== "move-end-square")
        );
        newHighlights.push({
            index: move.getStartSquare(),
            color: highlightColorYellow,
            type: "move-start-square",
        });
        newHighlights.push({
            index: move.getEndSquare(),
            color: highlightColorYellow,
            type: "move-end-square",
        });
        setHighlights(newHighlights);
    }

    return (
        <div className="chess-board">
            {chessBoard.getPieces().map((value: Piece, index: number) => (
                <PieceSprite
                    key={value.getID()}
                    piece={value}
                    onClick={() => onPieceClicked(value.getPosition())}
                />
            ))}

            {moveHints.map((value: Move) => (
                <MoveHint
                    key={value.getEndSquare()}
                    move={value}
                    onClick={() => onMoveHintClicked(value)}
                />
            ))}

            {highlights.map((value: HighlightData) => (
                <Highlight key={value.index} data={value} />
            ))}
        </div>
    );
}

type HighlightData = {
    index: number;
    color: string;
    type: string;
};

function Highlight({ data }: { data: HighlightData }) {
    return (
        <div
            className={`on-chess-grid chess-highlight square-${ChessBoard.indexToSquare(data.index)}`}
            style={{ backgroundColor: data.color }}
        />
    );
}

function MoveHint({
    move,
    onClick,
}: {
    move: Move;
    onClick: MouseEventHandler;
}) {
    return (
        <div
            className={`on-chess-grid chess-hint square-${ChessBoard.indexToSquare(move.getEndSquare())}`}
            onClick={onClick}
        >
            <div
                className={`chess-hint-${move.checkIsCapture() ? "circle" : "dot"}`}
            />
        </div>
    );
}

function PieceSprite({
    piece,
    onClick,
}: {
    piece: Piece;
    onClick: MouseEventHandler;
}) {
    return (
        <div
            className={`on-chess-grid chess-piece square-${ChessBoard.indexToSquare(piece.getPosition())} side-${piece.getColor()} sprite-${piece.getAsLetter().toLowerCase()}`}
            onClick={onClick}
        />
    );
}

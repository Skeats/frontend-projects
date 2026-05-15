import {
    act,
    Dispatch,
    FormEventHandler,
    MouseEventHandler,
    ReactNode,
    SetStateAction,
    useRef,
    useState,
} from "react";
import "./chess.css";
import { ChessBoard } from "./chessBoard";
import { FEN } from "./FEN";
import { Piece } from "./chessPiece";
import { startingBoardPosition } from "./chessUtils";
import { MoveGenerator, Move } from "./moveGenerator";
import { PGN } from "./PGN";
import { UCI } from "./UCI";

enum ControlMode {
    PLAYER,
    ENGINE,
}

const highlightColorYellow = "#ffe7619a";
const highlightColorRed = "#ff2f2fa0";

const moveSound = new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/move-self.mp3");
const captureSound = new Audio("https://images.chesscomfiles.com/chess-themes/sounds/_MP3_/default/capture.mp3");

// Exported component
export function Chess() {
    const [chessBoard, setChessBoard] = useState<ChessBoard>(
        ChessBoard.startingPosition(),
    );
    const [whiteControlMode, setWhiteControlMode] = useState<ControlMode>(
        ControlMode.PLAYER,
    );
    const [blackControlMode, setBlackControlMode] = useState<ControlMode>(
        ControlMode.PLAYER,
    );
    const moveGenerator = new MoveGenerator();

    chessBoard.addBoardUpdateCallback(() => setChessBoard(chessBoard));
    const engine = new UCI("/home/skeatsies/.local/share/org.encroissant.app/engines/stockfish/stockfish-ubuntu-x86-64-avx2");

    return (
        <div className="chess-game">
            <Board
                chessBoard={chessBoard}
                setChessBoard={setChessBoard}
                moveGenerator={moveGenerator}
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
    let activeTab: string = "";

    return (
        <div className="chess-sidebar">
            <div className="sidebar-tab-bar">
                <SidebarTab tabName="Setup" activeTab={activeTab} />
            </div>
            <SidebarTabContent active={activeTab == "Setup"}>
                <LoadGameForm
                    chessBoard={chessBoard}
                    setChessBoard={setChessBoard}
                />
            </SidebarTabContent>
        </div>
    );
}

function SidebarTab({
    tabName,
    activeTab
}: {
    tabName: string
    activeTab: string
}) {
    return (
        <button onClick={() => activeTab = tabName} className="sidebar-tab">{tabName}</button>
    )
}

function SidebarTabContent({
    active,
    children
}: {
    active: boolean
    children: ReactNode
}) {
    return (
        <div className={`${active ? "sidebar-tab-content-active" : "sidebar-tab-content-inactive"}`}>
            {children}
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
}) {}

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

        if (FEN.isValid(cleanedString)) {
            setChessBoard(FEN.interpret(cleanedString));
            chessBoard.addBoardUpdateCallback(() =>
                setChessBoard(chessBoard),
            );
        } else if (PGN.isValidPGN(cleanedString)) {
            setChessBoard(PGN.interpret(cleanedString));
            chessBoard.addBoardUpdateCallback(() =>
                setChessBoard(chessBoard),
            );
        } else alert("Invalid string given.");
    }

    return (
        <form className="load-game-form" method="post" onSubmit={onLoadGame}>
            <div className="game-input-field">
                <textarea
                    name="game-string"
                    placeholder="Enter a FEN/PGN string"
                    rows={7}
                />
                <button type="submit">Load Game</button>
            </div>
        </form>
    );
}

function Board({
    chessBoard,
    setChessBoard,
    moveGenerator,
    whiteControlMode,
    blackControlMode,
}: {
    chessBoard: ChessBoard;
    setChessBoard: Dispatch<SetStateAction<ChessBoard>>;
    moveGenerator: MoveGenerator;
    whiteControlMode: ControlMode;
    blackControlMode: ControlMode;
}) {
    const [highlights, setHighlights] = useState<Array<HighlightData>>([]);
    const [moveHints, setMoveHints] = useState<Array<Move>>([]);

    function onPieceClicked(index: number) {
        const moves: Array<Move> = moveGenerator
            .generateMoves(chessBoard)
            .filter((value: Move) => value.getStartSquare() == index);

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
        if (move.checkIsCapture())
            captureSound.play();
        else
            moveSound.play();
        console.log(FEN.generate(chessBoard));

        // Filter out old highlight squares and non-selection highlights
        let newHighlights = highlights.filter(
            (value: HighlightData) =>
                value.index !== move.getStartSquare() &&
                value.index !== move.getEndSquare() &&
                value.type !== "move-start-square" &&
                value.type !== "move-end-square",
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
            className={`on-chess-grid chess-piece square-${ChessBoard.indexToSquare(piece.getPosition())} sprite-${piece.getColorAsLetter() + piece.getAsLetter().toUpperCase()}`}
            onClick={onClick}
        />
    );
}

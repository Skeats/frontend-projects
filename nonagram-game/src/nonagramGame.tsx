import { useState, type MouseEventHandler } from "react";
import React from "react";
import "./nonagramGame.css";

const SquareState = {
  OPEN: "open",
  FILLED: "filled",
  CROSSED: "crossed",
  DISABLED: "disabled",
}

let timerStarted = false;
let interval: number;
let hasWon = false;

export default function NonagramGame() {
  const [gridSize, setGridSize] = useState<number>(5);
  const [solutionSize, setSolutionSize] = useState<number>(13); // Default solution size
  const [solutionState, setSolutionState] = useState<Array<string>>(generatePuzzle(gridSize, solutionSize));
  const [puzzleState, setPuzzleState] = useState<Array<string>>(new Array(gridSize * gridSize).fill(SquareState.OPEN));
  const [timer, setTimer] = useState<number>(0);

  function startTimer() {
    if (timerStarted) return; // Prevent multiple intervals
    timerStarted = true;
    setTimer(0);
    const startTime = Date.now();
    interval = setInterval(() => {
      const elapsed = Date.now() - startTime;
      setTimer(elapsed);
    }, 1);
    console.log("Timer started with interval ID:", interval);
  }

  function stopTimer() {
    console.log("Timer stopped at:", timer);
    clearInterval(interval);
    timerStarted = false;
    interval = 0;
  }

  function newPuzzle() {
    setSolutionState(generatePuzzle(gridSize, solutionSize));
    const newPuzzleState = new Array(gridSize * gridSize).fill(SquareState.OPEN);
    stopTimer()
    hasWon = false;
    console.log("New puzzle generated:", solutionState);

    for (let i = 0; i < gridSize; i++) {
      if (isColumnComplete(i, gridSize, newPuzzleState, solutionState)) {
        console.log(`Column ${i} is complete. Current state: ${newPuzzleState}, solution state: ${solutionState}`);
        getSquaresInColumn(i, gridSize).forEach((index) => {
          if (newPuzzleState[index] === SquareState.OPEN) {
            newPuzzleState[index] = SquareState.DISABLED;
          }
        });
      }
      if (isRowComplete(i, gridSize, newPuzzleState, solutionState)) {
        console.log(`Row ${i} is complete. Current state: ${newPuzzleState}, solution state: ${solutionState}`);
        getSquaresInRow(i, gridSize).forEach((index) => {
          if (newPuzzleState[index] === SquareState.OPEN) {
            newPuzzleState[index] = SquareState.DISABLED;
          }
        });
      }
    }

    setPuzzleState(newPuzzleState);
  }

  function changeGridSize(newSize: number) {
    setGridSize(newSize);
    newPuzzle();
  }

  function changeSolutionSize(newSize: number) {
    setSolutionSize(newSize);
    newPuzzle();
    console.log(`Solution size changed to: ${newSize}`);
  }

  function onSquareClick(event: React.MouseEvent<HTMLDivElement>) {
    if (hasWon) return; // Prevent further clicks after winning
    const target = event.currentTarget;
    const index = parseInt(target.id.replace("nonagram_square_", ""), 10);
    const newPuzzleState = [...puzzleState];

    if (event.type === "contextmenu") {
      event.preventDefault(); // Prevent the default context menu from appearing
      newPuzzleState[index] = puzzleState[index] === SquareState.CROSSED ? SquareState.OPEN : SquareState.CROSSED;
    } else {
      newPuzzleState[index] = puzzleState[index] === SquareState.OPEN ? SquareState.FILLED : SquareState.OPEN;

      const rowIndex = Math.floor(index / gridSize);
      const columnIndex = index % gridSize;
      const columnSquares = getSquaresInColumn(columnIndex, gridSize);
      const rowSquares = getSquaresInRow(rowIndex, gridSize);
      if (isColumnComplete(columnIndex, gridSize, newPuzzleState, solutionState)) {
        columnSquares.forEach((index) => {
          if (newPuzzleState[index] === SquareState.OPEN) {
            newPuzzleState[index] = SquareState.DISABLED;
          }
        });
      } else {
        columnSquares.forEach((index) => {
          if (newPuzzleState[index] === SquareState.DISABLED && !isRowComplete(Math.floor(index / gridSize), gridSize, newPuzzleState, solutionState)) {
            newPuzzleState[index] = SquareState.OPEN;
          }
        });
      }

      if (isRowComplete(rowIndex, gridSize, newPuzzleState, solutionState)) {
        rowSquares.forEach((index) => {
          if (newPuzzleState[index] === SquareState.OPEN) {
            newPuzzleState[index] = SquareState.DISABLED;
          }
        });
      } else {
        rowSquares.forEach((index) => {
          if (newPuzzleState[index] === SquareState.DISABLED && !isColumnComplete(index % gridSize, gridSize, newPuzzleState, solutionState)) {
            newPuzzleState[index] = SquareState.OPEN;
          }
        });
      }
    }

    setPuzzleState(newPuzzleState);

    if (newPuzzleState.every((state, idx) => {
      return state === SquareState.FILLED || (state === SquareState.DISABLED && solutionState[idx] === SquareState.CROSSED) || (state === SquareState.CROSSED && solutionState[idx] === SquareState.CROSSED);
    })) {
      stopTimer();
      hasWon = true;
      alert("Congratulations! You've solved the puzzle!");
    }
    else {
      startTimer();
    }
  }

  return (
    <div className="nonagram-game-wrapper">
      <h1>Kiki's Nonagram Game</h1>
      <h3>
        Welcome to my nonagram game! Scroll down for instructions on how to
        play.
      </h3>
      <div className="nonagram-game">
        <Board gridSize={gridSize} puzzleState={puzzleState} solutionState={solutionState} onSquareClick={onSquareClick} />
        <Controls
          gridSize={gridSize}
          timer={timer}
          solutionSize={solutionSize}
          onChangeGridSize={(newSize: number) => changeGridSize(newSize)}
          onNewPuzzle={newPuzzle}
          onChangeSolutionSize={(newSize: number) => changeSolutionSize(newSize)}
          />
      </div>
    </div>
  );
}

function Controls(
  { gridSize, timer, solutionSize, onChangeGridSize, onNewPuzzle, onChangeSolutionSize }:
  { gridSize: number,
    timer: number,
    solutionSize: number,
    onChangeGridSize: (newSize: number) => void,
    onNewPuzzle: MouseEventHandler<HTMLButtonElement>,
    onChangeSolutionSize: (newSize: number) => void
  }
) {
  return (
    <div className="nonagram-controls">
      <h3 className="nonagram-timer" >{`${Math.floor(((timer / 1000) % 3600) / 60)}:${((timer / 1000) % 60).toFixed(3)}`}</h3>
      <button className="nonagram-control-button" onClick={onNewPuzzle}>New Puzzle</button>
      <button className="nonagram-control-button" onClick={() => onChangeGridSize(Math.min(gridSize + 1, 25))}>
        Increase Grid Size
      </button>
      <button
        className="nonagram-control-button"
        onClick={() => onChangeGridSize(Math.max(gridSize - 1, 5))}
        disabled={gridSize <= 1}
      >
        Decrease Grid Size
      </button>
      <button className="nonagram-control-button" onClick={() => onChangeSolutionSize(Math.min(solutionSize + 1, gridSize * gridSize))}>
        Increase Solution Size
      </button>
      <button className="nonagram-control-button" onClick={() => onChangeSolutionSize(Math.max(solutionSize - 1, 0))}>
        Decrease Solution Size
      </button>
    </div>
  );
}

function Board(
  { gridSize,
    puzzleState,
    solutionState,
    onSquareClick
  }:
  { gridSize: number,
    puzzleState: string[],
    solutionState: string[],
    onSquareClick: MouseEventHandler<HTMLDivElement>
  }) {
  return (
    <div
      className="nonagram-board"
      style={{ "--nonagram-size": gridSize } as React.CSSProperties}
    >
      <div /> {/* Placeholder for top-left corner */}

      {/* Column labels */}
      {Array.from({ length: gridSize }, (_, index) => (
        <div key={`row-${index}`} className="nonagram-label nonagram-column-label" id={`nonagram-column-${index}`}>
          {calculateColumnHint(index, gridSize, solutionState).map((hint, i) => (
            <p key={i} className="nonagram-hint">
              {hint}
            </p>
          ))}
        </div>
      ))}

      {Array.from({ length: gridSize * gridSize }, (_, index) => (
        <React.Fragment key={`group-${index}`}>
          {index % gridSize == 0 ? (
            <div key={`col-${index}`} className="nonagram-label nonagram-row-label" id={`nonagram-row-${index / gridSize}`}>
              {calculateRowHint(Math.floor(index / gridSize), gridSize, solutionState).map((hint, i) => (
                <p key={`hint-${index}-${i}`} className="nonagram-hint">
                  {hint}
                </p>
              ))}
            </div>
          ) : null}
          <Square key={index} index={index} state={puzzleState[index]} onClick={onSquareClick} />
        </React.Fragment>
      ))}
    </div>
  );
}

function Square({ index, state, onClick }: { index: number; state: string, onClick?: MouseEventHandler<HTMLDivElement> }) {
  return (
    <div
      className={`nonagram-square nonagram-square-${state}`}
      key={index}
      id={`nonagram_square_${index}`}
      onClick={onClick}
      onContextMenu={onClick}
    >
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      >
        <line x1="18" y1="6" x2="6" y2="18" />
        <line x1="6" y1="6" x2="18" y2="18" />
      </svg>
    </div>
  );
}

function generatePuzzle(gridSize: number, solutionSize: number): string[] {
  const arr = Array.from({ length: gridSize * gridSize }, () => SquareState.CROSSED);

  for (let i = 0; i < solutionSize; i++) {
    const randomIndex = Math.floor(Math.random() * (gridSize * gridSize));
    if (arr[randomIndex] === SquareState.CROSSED) {
      arr[randomIndex] = SquareState.FILLED;
    } else {
      i--; // Retry if the square is already filled
    }
  }

  return arr;
}

function calculateRowHint(row: number, gridSize:number, solutionState: string[]): number[] {
  const rowSquares = getSquaresInRow(row, gridSize);

  return calculateHint(rowSquares.map((_, index) => solutionState[row * gridSize + index]));
}

function calculateColumnHint(column: number, gridSize: number, solutionState: string[]): number[] {
  const columnSquares = getSquaresInColumn(column, gridSize);

  return calculateHint(columnSquares.map((_, index) => solutionState[index * gridSize + column]));
}

// Calculates the hints for a given set of squares, returning an array of counts of consecutive filled squares.
function calculateHint(squares: string[]): number[] {
  const hints: number[] = [];
  let count = 0;

  for (const square of squares) {
    if (square === SquareState.FILLED) {
      count++;
    } else {
      if (count > 0) {
        hints.push(count);
        count = 0;
      }
    }
  }

  if (count > 0) {
    hints.push(count);
  }

  if (hints.length === 0) {
    hints.push(0); // Ensure at least one hint is present
  }

  return hints;
}

// Returns whether the row is complete based on the filled squares in the board state compared to the solution state.
function isRowComplete(row: number, gridSize: number, boardState: string[], solutionState: string[]): boolean {
  return calculateRowFilledCount(row, gridSize, boardState) >= calculateRowFilledCount(row, gridSize, solutionState)
}

// Returns whether the column is complete based on the filled squares in the board state compared to the solution state.
function isColumnComplete(column: number, gridSize: number, boardState: string[], solutionState: string[]): boolean {
  return calculateColumnFilledCount(column, gridSize, boardState) >= calculateColumnFilledCount(column, gridSize, solutionState);
}

// Calculates the number of filled squares in a row based on the board state.
function calculateRowFilledCount(row: number, gridSize: number, boardState: string[]): number {
  const rowSquares = getSquaresInRow(row, gridSize);
  const filteredSquares = rowSquares.filter(square => boardState[square] === SquareState.FILLED).length;
  console.log(`Row ${row} filled count: ${filteredSquares}`);
  return filteredSquares;
}

// Calculates the number of filled squares in a column based on the board state.
function calculateColumnFilledCount(column: number, gridSize: number, boardState: string[]): number {
  const columnSquares = getSquaresInColumn(column, gridSize);
  const filteredSquares = columnSquares.filter(square => boardState[square] === SquareState.FILLED).length;
  console.log(`Column ${column} filled count: ${filteredSquares}`);
  return filteredSquares;
}

// Returns the indices of the squares in a given row.
function getSquaresInRow(row: number, gridSize: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    indices.push(row * gridSize + i);
  }
  return indices;
}

// Returns the indices of the squares in a given column.
function getSquaresInColumn(column: number, gridSize: number): number[] {
  const indices: number[] = [];
  for (let i = 0; i < gridSize; i++) {
    indices.push(i * gridSize + column);
  }
  return indices;
}

import { useState } from "react";

export default function Cell({
  position,
  boardState,
  setBoardState,
}: {
  position: { x: number; y: number };
  boardState: number[][];
  setBoardState: (newBoardState: number[][]) => void;
}) {
  let stateStyles: string = "";

  switch (boardState[position.y][position.x]) {
    case 0:
      stateStyles = "cell-empty";
      break;
    case 1:
      stateStyles = "cell-filled";
      break;
    case 2:
      stateStyles = "cell-crossed";
      break;
    case 3:
      stateStyles = "cell-incorrect";
      break;
    default:
      break;
  }

  function onCellEvent(event: React.MouseEvent<HTMLButtonElement>) {
    const newBoardState = structuredClone(boardState);
    if (event.type === "contextmenu") { // Right Click
      event.preventDefault(); // Prevent the default context menu from appearing
      newBoardState[position.y][position.x] = newBoardState[position.y][position.x] == 2 ? 0 : 2;
      console.log(position)
      console.log(newBoardState)
    } else { // Left Click
      newBoardState[position.y][position.x] = newBoardState[position.y][position.x] == 0 ? 1 : 0;
    }

    setBoardState(newBoardState);
  }

  return (
    <button
      className={`nonogram-cell ${stateStyles}`}
      onClick={onCellEvent}
      onContextMenu={onCellEvent}
    />
  );
}

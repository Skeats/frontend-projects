"use client";
import { ChangeEvent, ChangeEventHandler, FormEvent, useState } from "react";
import Cell from "./cell";
import "./styles.css";
import { HtmlContext } from "next/dist/server/route-modules/pages/vendored/contexts/entrypoints";

export default function Board() {
  const [boardSizeX, setBoardSizeX] = useState<number>(5);
  const [boardSizeY, setBoardSizeY] = useState<number>(5);
  const [boardState, setBoardState] = useState<number[][]>(
    GenerateBoard(boardSizeX, boardSizeY)
  );

  function changeWidth(value: ChangeEvent<HTMLInputElement>) {
    setBoardSizeX(parseInt(value.target.value));
    setBoardState(GenerateBoard(boardSizeX, boardSizeY))
    console.log(boardSizeX);
  }

  function changeHeight(value: ChangeEvent<HTMLInputElement>) {
    setBoardSizeY(parseInt(value.target.value));
    setBoardState(GenerateBoard(boardSizeX, boardSizeY))
    console.log(boardSizeY);
  }

  return (
    <div className="relative w-full flex justify-center">
      <div className="relative">
        <div className="absolute right-full">
          <h1 className="text-2xl text-center m-8">
            Kiki&apos;s Nonogram Game (v2)
          </h1>
          <div>
            <label htmlFor="width">Board Width</label>
            <input
              type="number"
              id="width"
              name="width"
              min={5}
              max={25}
              defaultValue={boardSizeX}
              onInput={changeWidth}
            />
            <label htmlFor="height">Board Height</label>
            <input
              type="number"
              id="height"
              name="height"
              min={5}
              max={25}
              defaultValue={boardSizeY}
              onInput={changeHeight}
            />
          </div>
        </div>
        <div
          className={`w-3xl h-fit rounded-2xl overflow-hidden overflow-y-auto`}
        >
          {boardState.map((row, rowIndex) => (
            <div key={rowIndex} className="nonogram-row">
              {row.map((cell, cellIndex) => (
                <Cell
                  key={rowIndex * boardSizeX + cellIndex}
                  position={{ x: cellIndex, y: rowIndex }}
                  boardState={boardState}
                  setBoardState={setBoardState}
                />
              ))}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function GenerateBoard(x: number, y: number): number[][] {
  const board: number[][] = Array(y).fill(Array(x).fill(0));
  return board;
}

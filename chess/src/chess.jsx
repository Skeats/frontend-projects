import { useState } from 'react';
import './chess.css';

// Enum for pieces and sides
const Pieces = Object.freeze({
    KING: 0,
    QUEEN: 1,
    ROOK: 2,
    BISHOP: 3,
    KNIGHT: 4,
    PAWN: 5
});

const Sides = Object.freeze({
    WHITE: 0,
    BLACK: 1
});

// Exported component
export function Chess() {
    return (
    <div className="chess-game">
      <Board />
    </div>
  );
}

function Board() {
    const squares = Array(64).fill(null);
    return (
        <div className="chess-board">
        {squares.map((value, index) => (
            <Square
                classes={index % 2 == 0 ? 'WHITE' : 'BLACK'}
                key={index}
                value={value}
            />
        ))}
        </div>
    );
}

function Square(classes, key, value) {
    return <div className={`chess-square ${classes}`} key={key} value={value}><span>{key}</span></div>;
}
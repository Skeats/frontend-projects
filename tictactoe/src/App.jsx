import { useState } from 'react';
import './App.css';

function App() {
  const [squares, setSquares] = useState(Array(9).fill(null));
  const [status, setStatus] = useState('X');

  function handleClick(index) {
    if (squares[index] || calculateWinner(squares)) return;

    const newSquares = squares.slice();
    newSquares[index] = status;
    setSquares(newSquares);
    setStatus(status === 'X' ? 'O' : 'X');
  }

  function calculateWinner(squares) {
    const lines = [
      [0, 1, 2],
      [3, 4, 5],
      [6, 7, 8],
      [0, 3, 6],
      [1, 4, 7],
      [2, 5, 8],
      [0, 4, 8],
      [2, 4, 6]
    ];

    for (let i = 0; i < lines.length; i++) {
      const [a, b, c] = lines[i];
      if (squares[a] && squares[a] === squares[b] && squares[a] === squares[c]) {
        return squares[a];
      }
    }
    return null;
  }

  const winner = calculateWinner(squares);
  let gameStatus;
  if (winner) {
    gameStatus = `Winner: ${winner}`;
  } else {
    gameStatus = `Next player: ${status}`;
  }

  return (
    <>
      <h2>{gameStatus}</h2>
      <div className="grid-container">
        {squares.map((value, index) => (
          <Square key={index} value={value} onClick={() => handleClick(index)} />
        ))}
      </div>
    </>
  );
}

function Square(props) {
  return (
    <button className="grid-square" onClick={props.onClick}>
      {props.value}
    </button>
  )
}

export default App;

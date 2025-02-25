import { useState } from 'react';
import PropTypes from 'prop-types';
import './App.css';

export default function App() {
  const [status, setStatus] = useState('X');
  const [history, setHistory] = useState([Array(9).fill(null)]);
  const currentState = history[history.length - 1];

  function handlePlay(nextSquares) {
    setHistory([...history, nextSquares]);
    setStatus(status === 'X' ? 'O' : 'X');
  }

  function jumpTo(step) {
    setHistory(history.slice(0, step + 1));
    setStatus(step % 2 === 0 ? 'X' : 'O');
  }

  const moves = history.map((_step, move) => {
    const desc = move ? `Go to move #${move}` : 'Go to game start';
    return (
      <li className='game-info-list-item' key={move}>
        <button className={`game-info-button ${move % 2 === 0 ? 'X' : 'O'}`} onClick={() => jumpTo(move)}>{desc}</button>
      </li>
    );
  });

  return (
    <>
      <h1>Kiki&apos;s Tic Tac Toe!</h1>
      <div className="game">
        <Board status={status} squares={currentState} onPlay={handlePlay} />
        <div className="game-info">
          <h2>Game history</h2>
          <ol>
            {moves}
          </ol>
        </div>
      </div>
    </>
  );
}

function Board(props) {
    function handleClick(index) {
      if (props.squares[index] || calculateWinner(props.squares)) return;

      const newSquares = props.squares.slice();
      newSquares[index] = props.status;

      props.onPlay(newSquares);
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

    const winner = calculateWinner(props.squares);
    const isDraw = !(props.squares.includes(null));
    let statusText;
    if (winner) {
      statusText = <>Winner: <span className={winner}>{winner}</span></>;
    } else if (isDraw) {
      statusText = <>Draw!</>;
    } else {
      statusText = <>Next player: <span className={props.status}>{props.status}</span></>;
    }

    return (
      <>
        <h2 className="game-status">{statusText}</h2>
        <div className="grid-container">
          {props.squares.map((value, index) => (
            <Square
              key={index}
              value={value}
              onClick={() => handleClick(index)}
              classes={value ? value.toString() : `hoverable-square`}
            />
          ))}
        </div>
      </>
    );
}

Board.propTypes = {
  status: PropTypes.string.isRequired,
  squares: PropTypes.arrayOf(PropTypes.string).isRequired,
  onPlay: PropTypes.func.isRequired,
};

function Square(props) {
  return (
    <button className={`grid-square ${props.classes}`} onClick={props.onClick}>
      <span>{props.value}</span>
    </button>
  )
}

Square.propTypes = {
  value: PropTypes.string,
  onClick: PropTypes.func.isRequired,
  classes: PropTypes.string,
};
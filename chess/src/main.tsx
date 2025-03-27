import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import { Chess } from './chess'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Chess />
    <h2>TODO:</h2>
    <ul>
      <li>Fix bug where sliding pieces will teleport when on the edge of the board</li>
      <li>Add check, checkmate conditions</li>
      <li>Add castling</li>
      <li>Add en passant</li>
      <li>Add pawn promotion</li>
      <li>Add stalemate</li>
      <li>Add complementary sidebar UI</li>
      <li>Add game history</li>
      <li>Add game state persistence</li>
      <li>Add board flipping</li>
      <li>Add AI</li>
      <li>Add multiplayer</li>
      <li>Add animations</li>
      <li>Add sounds</li>
    </ul>
  </StrictMode>,
)

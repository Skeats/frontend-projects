import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import NonagramGame from './nonagramGame.tsx'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NonagramGame />
    <ul>
      <li>Add counter for grid/solution size</li>
      <li>Make it so that 0 rows/columns are automatically crossed out</li>
      <li>fix sizing issues</li>
      <li>Make a system that will show the number of possible solves</li>
      <li>fix the win condition so that any possible solve will win</li>
      <li>Add button to show and hide the timer</li>
    </ul>
  </StrictMode>,
)

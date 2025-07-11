import React from 'react';
import { motion } from 'framer-motion';
import { GridCell } from './GridCell';

interface GameBoardProps {
  gridState: (0 | number)[][];
  onCellClick: (row: number, col: number) => void;
  disabled: boolean;
  winningLine?: { row: number; col: number }[];
}

export const GameBoard: React.FC<GameBoardProps> = ({
  gridState,
  onCellClick,
  disabled,
  winningLine = [],
}) => {
  const isWinningCell = (row: number, col: number): boolean => {
    return winningLine.some((cell) => cell.row === row && cell.col === col);
  };

  return (
    <motion.div
      className="game-board"
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ type: 'spring', stiffness: 260, damping: 20 }}
    >
      {gridState.map((row, rowIndex) =>
        row.map((cell, colIndex) => (
          <GridCell
            key={`${rowIndex}-${colIndex}`}
            value={cell}
            onClick={() => onCellClick(rowIndex, colIndex)}
            disabled={disabled}
            isWinningCell={isWinningCell(rowIndex, colIndex)}
            row={rowIndex}
            col={colIndex}
          />
        ))
      )}
    </motion.div>
  );
};

// Add CSS for game-board
const gameBoardStyles = `
.game-board {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: var(--spacing-sm);
  padding: var(--spacing-lg);
  background: rgba(245, 245, 245, 0.05);
  border-radius: var(--radius-lg);
  border: 1px solid rgba(245, 245, 245, 0.1);
  max-width: 350px;
  margin: 0 auto;
}

@media (max-width: 768px) {
  .game-board {
    max-width: 280px;
    padding: var(--spacing-md);
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gameBoardStyles;
  document.head.appendChild(style);
}

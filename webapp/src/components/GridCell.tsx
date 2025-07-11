import React from 'react';
import { motion } from 'framer-motion';

interface GridCellProps {
  value: 0 | number;
  onClick: () => void;
  disabled: boolean;
  isWinningCell: boolean;
  row: number;
  col: number;
}

export const GridCell: React.FC<GridCellProps> = ({
  value,
  onClick,
  disabled,
  isWinningCell,
  row,
  col,
}) => {
  const isEmpty = value === 0;
  const isPlayer1 = value === 1;

  const getCellContent = () => {
    if (isEmpty) return null;
    return isPlayer1 ? '✕' : '○';
  };

  const getCellColor = () => {
    if (isEmpty) return 'transparent';
    return isPlayer1 ? 'var(--player-teal)' : 'var(--player-pink)';
  };

  return (
    <motion.div
      className={`grid-cell ${isEmpty ? 'empty' : 'filled'} ${
        isWinningCell ? 'winning' : ''
      } ${disabled ? 'disabled' : ''}`}
      onClick={isEmpty && !disabled ? onClick : undefined}
      whileHover={
        isEmpty && !disabled
          ? {
              scale: 1.05,
              backgroundColor: 'rgba(245, 245, 245, 0.1)',
            }
          : {}
      }
      whileTap={isEmpty && !disabled ? { scale: 0.95 } : {}}
      animate={{
        scale: isWinningCell ? [1, 1.1, 1] : 1,
      }}
      transition={{
        duration: 0.2,
        repeat: isWinningCell ? Infinity : 0,
        repeatType: 'reverse',
      }}
      style={
        {
          '--cell-color': getCellColor(),
        } as React.CSSProperties
      }
    >
      {!isEmpty && (
        <motion.span
          className="cell-mark"
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}
        >
          {getCellContent()}
        </motion.span>
      )}

      {isEmpty && !disabled && (
        <motion.div
          className="target-indicator"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.3 }}
          whileHover={{ opacity: 0.6 }}
        >
          ⊹
        </motion.div>
      )}
    </motion.div>
  );
};

// Add CSS for grid-cell
const gridCellStyles = `
.grid-cell {
  width: 100px;
  height: 100px;
  border: 2px solid rgba(245, 245, 245, 0.2);
  border-radius: var(--radius-md);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all var(--transition-fast);
  position: relative;
  background: rgba(245, 245, 245, 0.05);
}

.grid-cell.empty:hover {
  border-color: var(--accent-blue);
  box-shadow: 0 0 15px rgba(0, 123, 255, 0.2);
}

.grid-cell.filled {
  cursor: default;
  border-color: var(--cell-color);
}

.grid-cell.winning {
  border-color: var(--cell-color);
  box-shadow: 0 0 20px var(--cell-color);
}

.grid-cell.disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.cell-mark {
  font-size: 2.5rem;
  font-weight: bold;
  color: var(--cell-color);
  text-shadow: 0 0 10px var(--cell-color);
}

.target-indicator {
  font-size: 1.5rem;
  color: rgba(245, 245, 245, 0.3);
}

@media (max-width: 768px) {
  .grid-cell {
    width: 80px;
    height: 80px;
  }
  
  .cell-mark {
    font-size: 2rem;
  }
  
  .target-indicator {
    font-size: 1.2rem;
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gridCellStyles;
  document.head.appendChild(style);
}

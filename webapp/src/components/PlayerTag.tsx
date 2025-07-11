import React from 'react';
import { motion } from 'framer-motion';

interface PlayerTagProps {
  name: string;
  mark: '✕' | '○';
  isCurrentTurn: boolean;
  playerId: number;
}

export const PlayerTag: React.FC<PlayerTagProps> = ({
  name,
  mark,
  isCurrentTurn,
  playerId,
}) => {
  const playerClass = playerId === 1 ? 'player-1' : 'player-2';

  return (
    <motion.div
      className={`player-tag ${playerClass} ${
        isCurrentTurn ? 'current-turn' : ''
      }`}
      animate={{
        scale: isCurrentTurn ? [1, 1.05, 1] : 1,
        boxShadow: isCurrentTurn
          ? [
              '0 0 0 rgba(0, 123, 255, 0)',
              '0 0 20px rgba(0, 123, 255, 0.3)',
              '0 0 0 rgba(0, 123, 255, 0)',
            ]
          : '0 0 0 rgba(0, 123, 255, 0)',
      }}
      transition={{
        duration: 2,
        repeat: isCurrentTurn ? Infinity : 0,
        repeatType: 'reverse',
      }}
    >
      <div className="player-mark">{mark}</div>
      <div className="player-info">
        <div className="player-name">{name}</div>
        {isCurrentTurn && <div className="turn-indicator">Your Turn</div>}
      </div>
      {isCurrentTurn && (
        <motion.div
          className="pulse-indicator"
          animate={{
            opacity: [0.3, 1, 0.3],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            repeatType: 'reverse',
          }}
        />
      )}
    </motion.div>
  );
};

// Add CSS for player-tag
const playerTagStyles = `
.player-tag {
  display: flex;
  align-items: center;
  gap: var(--spacing-md);
  padding: var(--spacing-md);
  border-radius: var(--radius-lg);
  background: rgba(245, 245, 245, 0.05);
  border: 2px solid transparent;
  transition: all var(--transition-normal);
  position: relative;
}

.player-tag.current-turn {
  border-color: var(--accent-blue);
  background: rgba(0, 123, 255, 0.1);
}

.player-mark {
  width: 40px;
  height: 40px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.5rem;
  font-weight: bold;
  border: 2px solid currentColor;
  background: rgba(currentColor, 0.1);
}

.player-1 .player-mark {
  color: var(--player-teal);
}

.player-2 .player-mark {
  color: var(--player-pink);
}

.player-info {
  flex: 1;
}

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xs);
}

.turn-indicator {
  font-size: 0.875rem;
  color: var(--accent-blue);
  font-weight: 500;
}

.pulse-indicator {
  position: absolute;
  top: -5px;
  right: -5px;
  width: 12px;
  height: 12px;
  background: var(--accent-blue);
  border-radius: 50%;
  box-shadow: 0 0 10px var(--accent-blue);
}

@media (max-width: 768px) {
  .player-tag {
    padding: var(--spacing-sm);
    gap: var(--spacing-sm);
  }
  
  .player-mark {
    width: 35px;
    height: 35px;
    font-size: 1.25rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = playerTagStyles;
  document.head.appendChild(style);
}

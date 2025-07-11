import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Button, useToast } from '../components';
import { api, ApiError } from '../utils/api';
import { useGameStore } from '../state/gameStore';
import { useNavigate } from 'react-router-dom';

export const WelcomeView: React.FC = () => {
  const [playerName, setPlayerName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const { addToast } = useToast();
  const { setCurrentPlayer } = useGameStore();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!playerName.trim()) {
      setError('Please enter a player name');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const player = await api.createPlayer(playerName.trim());
      setCurrentPlayer(player);
      addToast(`Welcome, ${player.name}!`, 'success');
      navigate('/lobby');
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        setError('Name is already taken');
      } else {
        setError('Failed to create player. Please try again.');
        addToast('Failed to create player', 'error');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="welcome-view">
      <motion.div
        className="welcome-container"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.h1
          className="welcome-title"
          initial={{ scale: 0.8 }}
          animate={{ scale: 1 }}
          transition={{
            delay: 0.2,
            type: 'spring',
            stiffness: 260,
            damping: 20,
          }}
        >
          Grid-GE
        </motion.h1>

        <motion.p
          className="welcome-subtitle"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
        >
          Enter the ultimate grid-based battle arena
        </motion.p>

        <motion.form
          className="welcome-form"
          onSubmit={handleSubmit}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <div className="form-group">
            <label htmlFor="playerName" className="form-label">
              Player Name
            </label>
            <input
              id="playerName"
              type="text"
              value={playerName}
              onChange={(e) => {
                setPlayerName(e.target.value);
                setError('');
              }}
              placeholder="Enter your name"
              className={`input ${error ? 'input-error' : ''}`}
              disabled={isLoading}
              maxLength={20}
            />
            {error && <div className="error-message">{error}</div>}
          </div>

          <Button
            type="submit"
            variant="primary"
            isLoading={isLoading}
            disabled={!playerName.trim() || isLoading}
            className="welcome-button"
          >
            {isLoading ? 'Creating Player...' : 'Enter Lobby'}
          </Button>
        </motion.form>

        <motion.div
          className="game-preview"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
        >
          <div className="preview-grid">
            {Array.from({ length: 9 }, (_, i) => (
              <div key={i} className="preview-cell">
                {i === 0 && <span className="player-1">✕</span>}
                {i === 4 && <span className="player-2">○</span>}
                {i === 8 && <span className="player-1">✕</span>}
              </div>
            ))}
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

// Add CSS for welcome view
const welcomeStyles = `
.welcome-view {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, var(--bg-primary) 0%, #2A2A2A 100%);
  padding: var(--spacing-lg);
}

.welcome-container {
  max-width: 400px;
  width: 100%;
  text-align: center;
}

.welcome-title {
  font-size: 4rem;
  font-weight: 700;
  background: linear-gradient(45deg, var(--player-teal), var(--player-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin-bottom: var(--spacing-sm);
  text-shadow: 0 0 30px rgba(57, 204, 204, 0.3);
}

.welcome-subtitle {
  color: rgba(245, 245, 245, 0.8);
  font-size: 1.1rem;
  margin-bottom: var(--spacing-2xl);
}

.welcome-form {
  margin-bottom: var(--spacing-2xl);
}

.form-group {
  margin-bottom: var(--spacing-lg);
  text-align: left;
}

.form-label {
  display: block;
  margin-bottom: var(--spacing-sm);
  font-weight: 500;
  color: var(--text-primary);
}

.input-error {
  border-color: var(--danger);
  box-shadow: 0 0 0 3px rgba(220, 53, 69, 0.1);
}

.error-message {
  color: var(--danger);
  font-size: 0.875rem;
  margin-top: var(--spacing-sm);
}

.welcome-button {
  width: 100%;
  font-size: 1.1rem;
  padding: var(--spacing-md) var(--spacing-lg);
}

.game-preview {
  opacity: 0.6;
}

.preview-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-template-rows: repeat(3, 1fr);
  gap: 4px;
  max-width: 120px;
  margin: 0 auto;
}

.preview-cell {
  width: 35px;
  height: 35px;
  background: rgba(245, 245, 245, 0.1);
  border-radius: var(--radius-sm);
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: bold;
}

.preview-cell .player-1 {
  color: var(--player-teal);
}

.preview-cell .player-2 {
  color: var(--player-pink);
}

@media (max-width: 768px) {
  .welcome-title {
    font-size: 3rem;
  }
  
  .welcome-subtitle {
    font-size: 1rem;
  }
  
  .welcome-view {
    padding: var(--spacing-md);
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = welcomeStyles;
  document.head.appendChild(style);
}

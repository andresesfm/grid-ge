import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { useParams, useNavigate } from 'react-router-dom';
import { GameBoard, PlayerTag, Modal, Button, useToast } from '../components';
import { api, ApiError } from '../utils/api';
import { findWinningLine } from '../utils/gameUtils';
import { useGameStore } from '../state/gameStore';
import { Game, Move } from '../types';

export const GameView: React.FC = () => {
  const { gameId } = useParams<{ gameId: string }>();
  const [game, setGame] = useState<Game | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [optimisticMove, setOptimisticMove] = useState<{
    row: number;
    col: number;
  } | null>(null);
  const { addToast } = useToast();
  const { currentPlayer } = useGameStore();
  const navigate = useNavigate();

  // Redirect to welcome if no current player
  useEffect(() => {
    if (!currentPlayer) {
      navigate('/');
    }
  }, [currentPlayer, navigate]);

  // Fetch game state on mount and poll for updates
  useEffect(() => {
    if (!gameId || !currentPlayer) return;

    const fetchGame = async () => {
      try {
        const gameData = await api.getGame(gameId);
        setGame(gameData);

        // Show modal if game is finished
        if (
          (gameData.status === 'win' || gameData.status === 'draw') &&
          !isModalOpen
        ) {
          setIsModalOpen(true);
        }
      } catch (error) {
        console.error('Failed to fetch game:', error);
        if (error instanceof ApiError && error.status === 404) {
          addToast('Game not found', 'error');
          navigate('/lobby');
        } else {
          addToast('Failed to load game', 'error');
        }
      } finally {
        setIsLoading(false);
      }
    };

    fetchGame();

    // Poll for updates every 2-3 seconds
    const interval = setInterval(fetchGame, 2500);

    return () => clearInterval(interval);
  }, [gameId, currentPlayer, navigate, addToast, isModalOpen]);

  const handleCellClick = async (row: number, col: number) => {
    if (!game || !currentPlayer || !gameId) return;
    if (game.current_turn_player_id !== currentPlayer.id) return;
    if (game.grid[row][col] !== 0) return;

    // Optimistic update
    setOptimisticMove({ row, col });

    const move: Move = {
      playerId: currentPlayer.id,
      row,
      col,
    };

    try {
      await api.makeMove(gameId, move);
      // Success will be reflected in the next poll
    } catch (error) {
      console.error('Failed to make move:', error);
      setOptimisticMove(null); // Remove optimistic update
      if (error instanceof ApiError) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to make move', 'error');
      }
    }
  };

  const handleReturnToLobby = () => {
    setIsModalOpen(false);
    navigate('/lobby');
  };

  const getGameStatusText = () => {
    if (!game || !currentPlayer) return '';

    switch (game.status) {
      case 'waiting':
        return 'Waiting for opponent to join...';
      case 'in_progress':
        return game.current_turn_player_id === currentPlayer.id
          ? 'Your turn!'
          : "Opponent's turn...";
      case 'win':
        return game.winner_id === currentPlayer.id ? 'You Win!' : 'You Lose!';
      case 'draw':
        return "It's a Draw!";
      default:
        return '';
    }
  };

  const getModalTitle = () => {
    if (!game || !currentPlayer) return 'Game Over';

    if (game.status === 'win') {
      return game.winner_id === currentPlayer.id ? '🎉 Victory!' : '😔 Defeat';
    }
    if (game.status === 'draw') {
      return '🤝 Draw Game';
    }
    return 'Game Over';
  };

  const getModalMessage = () => {
    if (!game || !currentPlayer) return '';

    if (game.status === 'win') {
      const winner =
        game.winner_id === game.player1_id ? game.player1 : game.player2;
      return game.winner_id === currentPlayer.id
        ? `Congratulations! You won in ${game.move_count} moves.`
        : `${winner?.name} won the game.`;
    }
    if (game.status === 'draw') {
      return 'Good game! The board is full with no winner.';
    }
    return '';
  };

  // Create grid with optimistic update
  const getDisplayGrid = () => {
    if (!game) return [];

    const grid = game.grid.map((row) => [...row]);

    if (optimisticMove && currentPlayer) {
      const playerMark = currentPlayer.id === game.player1_id ? 1 : 2;
      grid[optimisticMove.row][optimisticMove.col] = playerMark;
    }

    return grid;
  };

  const isGameDisabled = () => {
    if (!game || !currentPlayer) return true;
    if (game.status !== 'in_progress') return true;
    if (game.current_turn_player_id !== currentPlayer.id) return true;
    return false;
  };

  if (isLoading) {
    return (
      <div className="game-view loading">
        <div className="container">
          <motion.div
            className="loading-spinner large"
            animate={{ rotate: 360 }}
            transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
          />
          <p>Loading game...</p>
        </div>
      </div>
    );
  }

  if (!game || !currentPlayer) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="game-view">
      <div className="container">
        <motion.div
          className="game-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="game-header">
            <Button
              onClick={() => navigate('/lobby')}
              variant="secondary"
              className="back-btn"
            >
              ← Back to Lobby
            </Button>
            <div className="game-status">{getGameStatusText()}</div>
          </div>

          <div className="players-section">
            {game.player1 && (
              <PlayerTag
                name={game.player1.name}
                mark="✕"
                isCurrentTurn={game.current_turn_player_id === game.player1.id}
                playerId={game.player1.id}
              />
            )}

            {game.player2 ? (
              <PlayerTag
                name={game.player2.name}
                mark="○"
                isCurrentTurn={game.current_turn_player_id === game.player2.id}
                playerId={game.player2.id}
              />
            ) : (
              <div className="waiting-player">
                <motion.div
                  className="loading-dots"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  Waiting for opponent...
                </motion.div>
              </div>
            )}
          </div>

          <div className="game-board-section">
            <GameBoard
              gridState={getDisplayGrid()}
              onCellClick={handleCellClick}
              disabled={isGameDisabled()}
              winningLine={
                game.status === 'win' ? findWinningLine(game.grid) : []
              }
            />
          </div>

          <div className="game-info">
            <p>Game ID: {game.id}</p>
            <p>Moves: {game.move_count}</p>
          </div>
        </motion.div>

        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title={getModalTitle()}
        >
          <div className="modal-game-over">
            <p className="modal-message">{getModalMessage()}</p>
            <Button
              onClick={handleReturnToLobby}
              variant="primary"
              className="modal-action-btn"
            >
              Return to Lobby
            </Button>
          </div>
        </Modal>
      </div>
    </div>
  );
};

// Add CSS for game view
const gameViewStyles = `
.game-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--spacing-lg) 0;
}

.game-view.loading {
  display: flex;
  align-items: center;
  justify-content: center;
  text-align: center;
}

.game-container {
  max-width: 800px;
  margin: 0 auto;
}

.game-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
}

.back-btn {
  min-width: 120px;
}

.game-status {
  font-size: 1.25rem;
  font-weight: 600;
  color: var(--accent-blue);
  text-align: center;
  flex: 1;
  margin: 0 var(--spacing-lg);
}

.players-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--spacing-lg);
  margin-bottom: var(--spacing-xl);
}

.waiting-player {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--spacing-lg);
  border: 2px dashed rgba(245, 245, 245, 0.3);
  border-radius: var(--radius-lg);
  color: rgba(245, 245, 245, 0.6);
}

.loading-dots {
  font-style: italic;
}

.game-board-section {
  margin-bottom: var(--spacing-xl);
}

.game-info {
  text-align: center;
  color: rgba(245, 245, 245, 0.6);
  font-size: 0.875rem;
}

.game-info p {
  margin-bottom: var(--spacing-sm);
}

.loading-spinner.large {
  width: 60px;
  height: 60px;
  border: 4px solid rgba(245, 245, 245, 0.2);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  margin: 0 auto var(--spacing-md);
}

.modal-game-over {
  text-align: center;
}

.modal-message {
  font-size: 1.1rem;
  margin-bottom: var(--spacing-xl);
  line-height: 1.6;
}

.modal-action-btn {
  min-width: 150px;
}

@media (max-width: 768px) {
  .game-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .game-status {
    margin: 0;
  }
  
  .players-section {
    grid-template-columns: 1fr;
    gap: var(--spacing-md);
  }
  
  .back-btn {
    width: 100%;
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = gameViewStyles;
  document.head.appendChild(style);
}

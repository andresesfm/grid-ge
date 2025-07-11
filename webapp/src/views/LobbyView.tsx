import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Button, useToast } from '../components';
import { api, ApiError } from '../utils/api';
import { useGameStore } from '../state/gameStore';
import { useNavigate } from 'react-router-dom';
import { Game } from '../types';

export const LobbyView: React.FC = () => {
  const [waitingGames, setWaitingGames] = useState<Game[]>([]);
  const [userGames, setUserGames] = useState<Game[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isCreatingGame, setIsCreatingGame] = useState(false);
  const { addToast } = useToast();
  const { currentPlayer } = useGameStore();
  const navigate = useNavigate();

  // Redirect to welcome if no current player
  useEffect(() => {
    if (!currentPlayer) {
      navigate('/', { replace: true });
    }
  }, [currentPlayer, navigate]); // Fetch games on component mount and then poll for updates
  useEffect(() => {
    console.log('LobbyView useEffect triggered, currentPlayer:', currentPlayer);
    if (!currentPlayer) return;

    const fetchGames = async () => {
      try {
        console.log('Fetching games...');
        setIsLoading(true);

        // Fetch waiting games and user's games in parallel
        const [waitingGamesData, userGamesData] = await Promise.all([
          api.getWaitingGames(),
          api.getUserGames(currentPlayer.id),
        ]);

        setWaitingGames(waitingGamesData);
        setUserGames(userGamesData);
        console.log('Games fetched successfully', {
          waitingGames: waitingGamesData.length,
          userGames: userGamesData.length,
        });
      } catch (error) {
        console.error('Failed to fetch games:', error);
        if (error instanceof ApiError) {
          addToast(`Failed to fetch games: ${error.message}`, 'error');
        } else {
          addToast('Failed to fetch games', 'error');
        }
      } finally {
        setIsLoading(false);
        console.log('Loading finished');
      }
    };

    fetchGames();

    // Re-enable polling now that API endpoints work
    const interval = setInterval(fetchGames, 5000);
    return () => clearInterval(interval);
  }, [currentPlayer, addToast]);

  const handleCreateGame = async () => {
    if (!currentPlayer) return;

    setIsCreatingGame(true);
    try {
      const result = await api.createGame(currentPlayer.id);
      addToast('Game created successfully!', 'success');

      // Navigate to the game view
      navigate(`/game/${result.gameId}`);
    } catch (error) {
      console.error('Failed to create game:', error);
      addToast('Failed to create game', 'error');
    } finally {
      setIsCreatingGame(false);
    }
  };

  const handleJoinGame = async (gameId: string) => {
    if (!currentPlayer) return;

    try {
      await api.joinGame(gameId, currentPlayer.id);
      addToast('Joined game successfully!', 'success');
      navigate(`/game/${gameId}`);
    } catch (error) {
      console.error('Failed to join game:', error);
      if (error instanceof ApiError) {
        addToast(error.message, 'error');
      } else {
        addToast('Failed to join game', 'error');
      }
    }
  };

  const handleViewGame = (gameId: string) => {
    navigate(`/game/${gameId}`);
  };

  if (!currentPlayer) {
    return null; // Will redirect in useEffect
  }

  return (
    <div className="lobby-view">
      <div className="container">
        <motion.header
          className="lobby-header"
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <h1>Welcome, {currentPlayer.name}!</h1>
          <div className="header-actions">
            <Button
              onClick={() => navigate('/leaderboard')}
              variant="secondary"
              className="leaderboard-btn"
            >
              Leaderboard
            </Button>
            <Button
              onClick={handleCreateGame}
              variant="primary"
              isLoading={isCreatingGame}
              className="create-game-btn"
            >
              Create New Game
            </Button>
          </div>
        </motion.header>

        <div className="lobby-content">
          <motion.section
            className="games-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <h2>Open Games</h2>
            <div className="games-grid">
              {isLoading ? (
                <div className="loading-placeholder">
                  <motion.div
                    className="loading-spinner"
                    animate={{ rotate: 360 }}
                    transition={{
                      duration: 1,
                      repeat: Infinity,
                      ease: 'linear',
                    }}
                  />
                  <p>Loading games...</p>
                </div>
              ) : waitingGames.length === 0 ? (
                <div className="empty-state">
                  <p>No open games available</p>
                  <p className="empty-subtitle">
                    Create a new game to get started!
                  </p>
                </div>
              ) : (
                waitingGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onJoin={() => handleJoinGame(game.id)}
                    isOwn={game.player1_id === currentPlayer.id}
                  />
                ))
              )}
            </div>
          </motion.section>

          <motion.section
            className="games-section"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            <h2>My Active Games</h2>
            <div className="games-grid">
              {userGames.length === 0 ? (
                <div className="empty-state">
                  <p>No active games</p>
                </div>
              ) : (
                userGames.map((game) => (
                  <GameCard
                    key={game.id}
                    game={game}
                    onView={() => handleViewGame(game.id)}
                    isOwn={true}
                  />
                ))
              )}
            </div>
          </motion.section>
        </div>
      </div>
    </div>
  );
};

interface GameCardProps {
  game: Game;
  onJoin?: () => void;
  onView?: () => void;
  isOwn: boolean;
}

const GameCard: React.FC<GameCardProps> = ({ game, onJoin, onView, isOwn }) => {
  const getStatusText = () => {
    switch (game.status) {
      case 'waiting':
        return 'Waiting for player';
      case 'in_progress':
        return 'In progress';
      case 'win':
        return 'Finished';
      case 'draw':
        return 'Draw';
      default:
        return 'Unknown';
    }
  };

  const getStatusColor = () => {
    switch (game.status) {
      case 'waiting':
        return 'var(--accent-blue)';
      case 'in_progress':
        return 'var(--success)';
      case 'win':
      case 'draw':
        return 'var(--warning)';
      default:
        return 'var(--text-primary)';
    }
  };

  return (
    <motion.div
      className="game-card"
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <div className="game-info">
        <div className="game-id">Game #{game.id.slice(-6)}</div>
        <div className="game-status" style={{ color: getStatusColor() }}>
          {getStatusText()}
        </div>
        <div className="game-players">
          <span>Player 1: {game.player1?.name || 'Unknown'}</span>
          {game.player2 && <span>Player 2: {game.player2.name}</span>}
        </div>
      </div>

      <div className="game-actions">
        {game.status === 'waiting' && !isOwn && (
          <Button
            onClick={onJoin}
            variant="primary"
            className="game-action-btn"
          >
            Join Game
          </Button>
        )}
        {(game.status === 'in_progress' || isOwn) && (
          <Button
            onClick={onView}
            variant="secondary"
            className="game-action-btn"
          >
            View Game
          </Button>
        )}
      </div>
    </motion.div>
  );
};

// Add CSS for lobby view
const lobbyStyles = `
.lobby-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--spacing-lg) 0;
}

.lobby-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-2xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
}

.lobby-header h1 {
  margin: 0;
  background: linear-gradient(45deg, var(--player-teal), var(--player-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.header-actions {
  display: flex;
  gap: var(--spacing-md);
}

.create-game-btn,
.leaderboard-btn {
  min-width: 120px;
}

.lobby-content {
  display: grid;
  gap: var(--spacing-2xl);
}

.games-section h2 {
  margin-bottom: var(--spacing-lg);
  color: var(--text-primary);
}

.games-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: var(--spacing-lg);
}

.loading-placeholder,
.empty-state {
  grid-column: 1 / -1;
  text-align: center;
  padding: var(--spacing-2xl);
  color: rgba(245, 245, 245, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 3px solid rgba(245, 245, 245, 0.2);
  border-top-color: var(--accent-blue);
  border-radius: 50%;
  margin: 0 auto var(--spacing-md);
}

.empty-subtitle {
  font-size: 0.875rem;
  margin-top: var(--spacing-sm);
}

.game-card {
  background: rgba(245, 245, 245, 0.05);
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: var(--radius-lg);
  padding: var(--spacing-lg);
  display: flex;
  flex-direction: column;
  gap: var(--spacing-md);
}

.game-info {
  flex: 1;
}

.game-id {
  font-weight: 600;
  font-size: 1.1rem;
  margin-bottom: var(--spacing-sm);
}

.game-status {
  font-weight: 500;
  margin-bottom: var(--spacing-sm);
}

.game-players {
  display: flex;
  flex-direction: column;
  gap: var(--spacing-xs);
  font-size: 0.875rem;
  color: rgba(245, 245, 245, 0.8);
}

.game-actions {
  display: flex;
  gap: var(--spacing-sm);
}

.game-action-btn {
  flex: 1;
  min-height: 40px;
}

@media (max-width: 768px) {
  .lobby-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .header-actions {
    flex-direction: column;
    width: 100%;
  }
  
  .create-game-btn,
  .leaderboard-btn {
    width: 100%;
  }
  
  .games-grid {
    grid-template-columns: 1fr;
  }
  
  .game-card {
    padding: var(--spacing-md);
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = lobbyStyles;
  document.head.appendChild(style);
}

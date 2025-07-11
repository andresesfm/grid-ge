import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Button, useToast } from '../components';
import { api } from '../utils/api';
import { useNavigate } from 'react-router-dom';
import { LeaderboardEntry, LeaderboardType } from '../types';

export const LeaderboardView: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [selectedType, setSelectedType] = useState<LeaderboardType>('wins');
  const [isLoading, setIsLoading] = useState(false);
  const { addToast } = useToast();
  const navigate = useNavigate();

  const fetchLeaderboard = useCallback(async () => {
    setIsLoading(true);
    try {
      const data = await api.getLeaderboard(selectedType);
      setLeaderboard(data);
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      addToast('Failed to load leaderboard', 'error');
    } finally {
      setIsLoading(false);
    }
  }, [selectedType, addToast]);

  useEffect(() => {
    fetchLeaderboard();
  }, [fetchLeaderboard]);

  const handleTypeChange = (type: LeaderboardType) => {
    setSelectedType(type);
  };

  const getScoreLabel = () => {
    return selectedType === 'wins' ? 'Wins' : 'Avg Moves';
  };

  const formatScore = (score: number) => {
    if (selectedType === 'wins') {
      return score.toString();
    } else {
      return score.toFixed(1);
    }
  };

  const getRankEmoji = (rank: number) => {
    switch (rank) {
      case 1:
        return '🥇';
      case 2:
        return '🥈';
      case 3:
        return '🥉';
      default:
        return `#${rank}`;
    }
  };

  return (
    <div className="leaderboard-view">
      <div className="container">
        <motion.div
          className="leaderboard-container"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="leaderboard-header">
            <Button
              onClick={() => navigate('/lobby')}
              variant="secondary"
              className="back-btn"
            >
              ← Back to Lobby
            </Button>
            <h1>Leaderboard</h1>
            <div></div> {/* Spacer for flex layout */}
          </div>

          <motion.div
            className="toggle-section"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            <div className="toggle-buttons">
              <Button
                onClick={() => handleTypeChange('wins')}
                variant={selectedType === 'wins' ? 'primary' : 'secondary'}
                className="toggle-btn"
              >
                By Wins
              </Button>
              <Button
                onClick={() => handleTypeChange('efficiency')}
                variant={
                  selectedType === 'efficiency' ? 'primary' : 'secondary'
                }
                className="toggle-btn"
              >
                By Efficiency
              </Button>
            </div>
            <p className="toggle-description">
              {selectedType === 'wins'
                ? 'Players ranked by total number of games won'
                : 'Players ranked by average moves per win (lower is better)'}
            </p>
          </motion.div>

          <motion.div
            className="leaderboard-content"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.6 }}
          >
            {isLoading ? (
              <div className="loading-state">
                <motion.div
                  className="loading-spinner"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                />
                <p>Loading leaderboard...</p>
              </div>
            ) : leaderboard.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">
                  <span role="img" aria-label="Trophy">
                    🏆
                  </span>
                </div>
                <h3>No Data Available</h3>
                <p>Play some games to see the leaderboard!</p>
                <Button
                  onClick={() => navigate('/lobby')}
                  variant="primary"
                  className="empty-action-btn"
                >
                  Start Playing
                </Button>
              </div>
            ) : (
              <div className="leaderboard-list">
                <div className="leaderboard-table-header">
                  <div className="header-rank">Rank</div>
                  <div className="header-name">Player</div>
                  <div className="header-score">{getScoreLabel()}</div>
                </div>

                {leaderboard.map((entry, index) => (
                  <motion.div
                    key={`${entry.name}-${index}`}
                    className={`leaderboard-item ${
                      entry.rank <= 3 ? 'top-player' : ''
                    }`}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.1 * index, duration: 0.4 }}
                    whileHover={{ scale: 1.02 }}
                  >
                    <div className={`rank rank-${entry.rank}`}>
                      {getRankEmoji(entry.rank)}
                    </div>
                    <div className="player-name">{entry.name}</div>
                    <div className="player-score">
                      {formatScore(entry.score)}
                    </div>

                    {entry.rank <= 3 && (
                      <motion.div
                        className="top-player-glow"
                        animate={{
                          opacity: [0.5, 1, 0.5],
                        }}
                        transition={{
                          duration: 2,
                          repeat: Infinity,
                          repeatType: 'reverse',
                        }}
                      />
                    )}
                  </motion.div>
                ))}
              </div>
            )}
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

// Add CSS for leaderboard view
const leaderboardStyles = `
.leaderboard-view {
  min-height: 100vh;
  background: var(--bg-primary);
  padding: var(--spacing-lg) 0;
}

.leaderboard-container {
  max-width: 600px;
  margin: 0 auto;
}

.leaderboard-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: var(--spacing-xl);
  padding-bottom: var(--spacing-lg);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
}

.leaderboard-header h1 {
  margin: 0;
  background: linear-gradient(45deg, var(--player-teal), var(--player-pink));
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  font-size: 2.5rem;
}

.back-btn {
  min-width: 120px;
}

.toggle-section {
  margin-bottom: var(--spacing-xl);
  text-align: center;
}

.toggle-buttons {
  display: flex;
  gap: var(--spacing-sm);
  justify-content: center;
  margin-bottom: var(--spacing-md);
}

.toggle-btn {
  min-width: 140px;
}

.toggle-description {
  color: rgba(245, 245, 245, 0.7);
  font-size: 0.875rem;
  max-width: 400px;
  margin: 0 auto;
}

.loading-state,
.empty-state {
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

.empty-icon {
  font-size: 4rem;
  margin-bottom: var(--spacing-md);
}

.empty-state h3 {
  color: var(--text-primary);
  margin-bottom: var(--spacing-sm);
}

.empty-action-btn {
  margin-top: var(--spacing-lg);
  min-width: 150px;
}

.leaderboard-list {
  background: rgba(245, 245, 245, 0.05);
  border: 1px solid rgba(245, 245, 245, 0.1);
  border-radius: var(--radius-lg);
  overflow: hidden;
}

.leaderboard-table-header {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: var(--spacing-md);
  padding: var(--spacing-md) var(--spacing-lg);
  background: rgba(245, 245, 245, 0.1);
  border-bottom: 1px solid rgba(245, 245, 245, 0.1);
  font-weight: 600;
  font-size: 0.875rem;
  color: rgba(245, 245, 245, 0.8);
}

.leaderboard-item {
  display: grid;
  grid-template-columns: 80px 1fr 100px;
  gap: var(--spacing-md);
  align-items: center;
  padding: var(--spacing-lg);
  border-bottom: 1px solid rgba(245, 245, 245, 0.05);
  position: relative;
  transition: all var(--transition-fast);
}

.leaderboard-item:last-child {
  border-bottom: none;
}

.leaderboard-item:hover {
  background: rgba(245, 245, 245, 0.05);
}

.leaderboard-item.top-player {
  background: rgba(255, 215, 0, 0.05);
  border-left: 3px solid gold;
}

.rank {
  font-weight: 700;
  font-size: 1.25rem;
  text-align: center;
}

.rank-1 { color: #FFD700; }
.rank-2 { color: #C0C0C0; }
.rank-3 { color: #CD7F32; }

.player-name {
  font-weight: 600;
  font-size: 1.1rem;
}

.player-score {
  font-weight: 700;
  font-size: 1.25rem;
  color: var(--accent-blue);
  text-align: center;
}

.top-player-glow {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: linear-gradient(90deg, transparent, rgba(255, 215, 0, 0.1), transparent);
  pointer-events: none;
}

@media (max-width: 768px) {
  .leaderboard-header {
    flex-direction: column;
    gap: var(--spacing-md);
    text-align: center;
  }
  
  .leaderboard-header h1 {
    font-size: 2rem;
  }
  
  .toggle-buttons {
    flex-direction: column;
    align-items: center;
  }
  
  .toggle-btn {
    width: 200px;
  }
  
  .leaderboard-table-header,
  .leaderboard-item {
    grid-template-columns: 60px 1fr 80px;
    padding: var(--spacing-md);
  }
  
  .rank {
    font-size: 1rem;
  }
  
  .player-name {
    font-size: 1rem;
  }
  
  .player-score {
    font-size: 1.1rem;
  }
  
  .back-btn {
    width: 100%;
  }
}
`;

// Inject styles into document
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = leaderboardStyles;
  document.head.appendChild(style);
}

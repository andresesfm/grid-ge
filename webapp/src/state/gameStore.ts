import { create } from 'zustand';
import { Player, Game, LeaderboardEntry, GameState } from '../types';

interface GameStore extends GameState {
  // Actions
  setCurrentPlayer: (player: Player | null) => void;
  setCurrentGame: (game: Game | null) => void;
  setGames: (games: Game[]) => void;
  addGame: (game: Game) => void;
  updateGame: (gameId: string, updates: Partial<Game>) => void;
  setLeaderboard: (leaderboard: LeaderboardEntry[]) => void;

  // Computed properties
  isPlayerTurn: (playerId: number) => boolean;
  getPlayerById: (playerId: number) => Player | undefined;
}

export const useGameStore = create<GameStore>((set, get) => ({
  // Initial state
  currentPlayer: null,
  currentGame: null,
  games: [],
  leaderboard: [],

  // Actions
  setCurrentPlayer: (player) => set({ currentPlayer: player }),

  setCurrentGame: (game) => set({ currentGame: game }),

  setGames: (games) => set({ games }),

  addGame: (game) =>
    set((state) => ({
      games: [...state.games, game],
    })),

  updateGame: (gameId, updates) =>
    set((state) => ({
      games: state.games.map((game) =>
        game.id === gameId ? { ...game, ...updates } : game
      ),
      currentGame:
        state.currentGame?.id === gameId
          ? { ...state.currentGame, ...updates }
          : state.currentGame,
    })),

  setLeaderboard: (leaderboard) => set({ leaderboard }),

  // Computed properties
  isPlayerTurn: (playerId) => {
    const { currentGame } = get();
    return currentGame?.current_turn_player_id === playerId;
  },

  getPlayerById: (playerId) => {
    const { currentGame } = get();
    if (!currentGame) return undefined;

    if (currentGame.player1?.id === playerId) return currentGame.player1;
    if (currentGame.player2?.id === playerId) return currentGame.player2;
    return undefined;
  },
}));

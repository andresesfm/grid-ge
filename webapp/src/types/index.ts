export interface Player {
  id: number;
  name: string;
  total_wins?: number;
  total_moves_in_wins?: number;
}

export interface Game {
  id: string;
  player1_id: number;
  player2_id: number | null;
  current_turn_player_id: number | null;
  status: 'waiting' | 'in_progress' | 'win' | 'draw';
  winner_id: number | null;
  grid: (0 | number)[][];
  move_count: number;
  player1?: Player;
  player2?: Player;
}

export interface Move {
  playerId: number;
  row: number;
  col: number;
}

export interface LeaderboardEntry {
  rank: number;
  name: string;
  score: number;
}

export interface GameState {
  currentPlayer: Player | null;
  currentGame: Game | null;
  games: Game[];
  leaderboard: LeaderboardEntry[];
}

export type GameStatus = 'waiting' | 'in_progress' | 'win' | 'draw';
export type LeaderboardType = 'wins' | 'efficiency';

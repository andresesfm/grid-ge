import {
  Player,
  Game,
  LeaderboardEntry,
  Move,
  LeaderboardType,
} from '../types';

const API_BASE_URL = 'http://localhost:3333/api';

class ApiError extends Error {
  constructor(public status: number, message: string) {
    super(message);
    this.name = 'ApiError';
  }
}

async function request<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const url = `${API_BASE_URL}${endpoint}`;
  const config: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
    ...options,
  };

  const response = await fetch(url, config);

  if (!response.ok) {
    const errorText = await response.text();
    throw new ApiError(response.status, errorText || response.statusText);
  }

  return response.json();
}

export const api = {
  // Player Management
  createPlayer: (name: string): Promise<Player> =>
    request<Player>('/players', {
      method: 'POST',
      body: JSON.stringify({ name }),
    }),

  // Game Management
  createGame: (
    playerId: number
  ): Promise<{ gameId: string; status: string; grid: number[][] }> =>
    request('/games', {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  joinGame: (gameId: string, playerId: number): Promise<void> =>
    request(`/games/${gameId}/join`, {
      method: 'POST',
      body: JSON.stringify({ playerId }),
    }),

  getGame: (gameId: string): Promise<Game> => request<Game>(`/games/${gameId}`),

  makeMove: (gameId: string, move: Move): Promise<void> =>
    request(`/games/${gameId}/move`, {
      method: 'POST',
      body: JSON.stringify(move),
    }),

  // Get waiting games (this might need to be added to the API)
  getWaitingGames: (): Promise<Game[]> =>
    request<Game[]>('/games?status=waiting'),

  // Get user's active games (this might need to be added to the API)
  getUserGames: (playerId: number): Promise<Game[]> =>
    request<Game[]>(`/games?playerId=${playerId}`),

  // Leaderboard
  getLeaderboard: (type: LeaderboardType): Promise<LeaderboardEntry[]> =>
    request<LeaderboardEntry[]>(`/leaderboard?by=${type}`),
};

export { ApiError };

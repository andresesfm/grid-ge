// Game utility functions
export const WINNING_LINES = [
  // Rows
  [
    { row: 0, col: 0 },
    { row: 0, col: 1 },
    { row: 0, col: 2 },
  ],
  [
    { row: 1, col: 0 },
    { row: 1, col: 1 },
    { row: 1, col: 2 },
  ],
  [
    { row: 2, col: 0 },
    { row: 2, col: 1 },
    { row: 2, col: 2 },
  ],
  // Columns
  [
    { row: 0, col: 0 },
    { row: 1, col: 0 },
    { row: 2, col: 0 },
  ],
  [
    { row: 0, col: 1 },
    { row: 1, col: 1 },
    { row: 2, col: 1 },
  ],
  [
    { row: 0, col: 2 },
    { row: 1, col: 2 },
    { row: 2, col: 2 },
  ],
  // Diagonals
  [
    { row: 0, col: 0 },
    { row: 1, col: 1 },
    { row: 2, col: 2 },
  ],
  [
    { row: 0, col: 2 },
    { row: 1, col: 1 },
    { row: 2, col: 0 },
  ],
];

export const findWinningLine = (
  grid: (0 | number)[][]
): { row: number; col: number }[] => {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    const valueA = grid[a.row][a.col];
    const valueB = grid[b.row][b.col];
    const valueC = grid[c.row][c.col];

    if (valueA !== 0 && valueA === valueB && valueB === valueC) {
      return line;
    }
  }
  return [];
};

export const formatGameId = (gameId: string): string => {
  return gameId.slice(-6).toUpperCase();
};

export const getPlayerColor = (playerId: number): string => {
  return playerId === 1 ? 'var(--player-teal)' : 'var(--player-pink)';
};

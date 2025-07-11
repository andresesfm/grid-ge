// Core game types
export type Grid = number[][];
export type GameStatus = 'waiting' | 'in_progress' | 'win' | 'draw';

/**
 * Creates an empty 3x3 grid
 */
export function createEmptyGrid(): Grid {
  return [
    [0, 0, 0],
    [0, 0, 0],
    [0, 0, 0],
  ];
}

/**
 * Validates if a move is valid (cell is empty and within bounds)
 */
export function isMoveValid(grid: Grid, row: number, col: number): boolean {
  if (row < 0 || row > 2 || col < 0 || col > 2) {
    return false;
  }
  return grid[row][col] === 0;
}

/**
 * Checks if a player has won the game
 */
export function checkWin(grid: Grid, playerId: number): boolean {
  // Check rows
  for (let row = 0; row < 3; row++) {
    if (
      grid[row][0] === playerId &&
      grid[row][1] === playerId &&
      grid[row][2] === playerId
    ) {
      return true;
    }
  }

  // Check columns
  for (let col = 0; col < 3; col++) {
    if (
      grid[0][col] === playerId &&
      grid[1][col] === playerId &&
      grid[2][col] === playerId
    ) {
      return true;
    }
  }

  // Check diagonals
  if (
    grid[0][0] === playerId &&
    grid[1][1] === playerId &&
    grid[2][2] === playerId
  ) {
    return true;
  }
  if (
    grid[0][2] === playerId &&
    grid[1][1] === playerId &&
    grid[2][0] === playerId
  ) {
    return true;
  }

  return false;
}

/**
 * Checks if the game is a draw (board is full with no winner)
 */
export function checkDraw(grid: Grid): boolean {
  for (let row = 0; row < 3; row++) {
    for (let col = 0; col < 3; col++) {
      if (grid[row][col] === 0) {
        return false;
      }
    }
  }
  return true;
}

/**
 * Makes a move on the grid
 */
export function makeMove(
  grid: Grid,
  row: number,
  col: number,
  playerId: number
): Grid {
  const newGrid = grid.map((row) => [...row]);
  newGrid[row][col] = playerId;
  return newGrid;
}

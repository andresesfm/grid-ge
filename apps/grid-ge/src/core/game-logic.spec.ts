import {
  createEmptyGrid,
  isMoveValid,
  checkWin,
  checkDraw,
  makeMove,
} from './game-logic';

describe('Core Game Logic', () => {
  describe('createEmptyGrid', () => {
    it('should create a 3x3 grid filled with zeros', () => {
      const grid = createEmptyGrid();
      expect(grid).toEqual([
        [0, 0, 0],
        [0, 0, 0],
        [0, 0, 0],
      ]);
    });
  });

  describe('isMoveValid', () => {
    it('should return true for valid moves on empty cells', () => {
      const grid = createEmptyGrid();
      expect(isMoveValid(grid, 0, 0)).toBe(true);
      expect(isMoveValid(grid, 1, 1)).toBe(true);
      expect(isMoveValid(grid, 2, 2)).toBe(true);
    });

    it('should return false for occupied cells', () => {
      const grid = [
        [1, 0, 0],
        [0, 2, 0],
        [0, 0, 1],
      ];
      expect(isMoveValid(grid, 0, 0)).toBe(false);
      expect(isMoveValid(grid, 1, 1)).toBe(false);
      expect(isMoveValid(grid, 2, 2)).toBe(false);
    });

    it('should return false for out of bounds coordinates', () => {
      const grid = createEmptyGrid();
      expect(isMoveValid(grid, -1, 0)).toBe(false);
      expect(isMoveValid(grid, 0, -1)).toBe(false);
      expect(isMoveValid(grid, 3, 0)).toBe(false);
      expect(isMoveValid(grid, 0, 3)).toBe(false);
    });
  });

  describe('makeMove', () => {
    it('should place player marker on the grid', () => {
      const grid = createEmptyGrid();
      const newGrid = makeMove(grid, 1, 1, 1);

      expect(newGrid[1][1]).toBe(1);
      expect(newGrid).not.toBe(grid); // Should return a new grid
    });

    it('should not modify the original grid', () => {
      const grid = createEmptyGrid();
      const originalGrid = JSON.parse(JSON.stringify(grid));

      makeMove(grid, 0, 0, 1);
      expect(grid).toEqual(originalGrid);
    });
  });

  describe('checkWin', () => {
    it('should detect horizontal wins', () => {
      const grid1 = [
        [1, 1, 1],
        [0, 0, 0],
        [0, 0, 0],
      ];
      const grid2 = [
        [0, 0, 0],
        [2, 2, 2],
        [0, 0, 0],
      ];
      const grid3 = [
        [0, 0, 0],
        [0, 0, 0],
        [1, 1, 1],
      ];

      expect(checkWin(grid1, 1)).toBe(true);
      expect(checkWin(grid2, 2)).toBe(true);
      expect(checkWin(grid3, 1)).toBe(true);
    });

    it('should detect vertical wins', () => {
      const grid1 = [
        [1, 0, 0],
        [1, 0, 0],
        [1, 0, 0],
      ];
      const grid2 = [
        [0, 2, 0],
        [0, 2, 0],
        [0, 2, 0],
      ];
      const grid3 = [
        [0, 0, 1],
        [0, 0, 1],
        [0, 0, 1],
      ];

      expect(checkWin(grid1, 1)).toBe(true);
      expect(checkWin(grid2, 2)).toBe(true);
      expect(checkWin(grid3, 1)).toBe(true);
    });

    it('should detect diagonal wins', () => {
      const grid1 = [
        [1, 0, 0],
        [0, 1, 0],
        [0, 0, 1],
      ];
      const grid2 = [
        [0, 0, 2],
        [0, 2, 0],
        [2, 0, 0],
      ];

      expect(checkWin(grid1, 1)).toBe(true);
      expect(checkWin(grid2, 2)).toBe(true);
    });

    it('should return false for no win condition', () => {
      const grid = [
        [1, 2, 1],
        [2, 1, 2],
        [2, 1, 2],
      ];

      expect(checkWin(grid, 1)).toBe(false);
      expect(checkWin(grid, 2)).toBe(false);
    });
  });

  describe('checkDraw', () => {
    it('should return true when grid is full with no winner', () => {
      const grid = [
        [1, 2, 1],
        [2, 1, 2],
        [2, 1, 2],
      ];

      expect(checkDraw(grid)).toBe(true);
    });

    it('should return false when grid has empty cells', () => {
      const grid = [
        [1, 2, 0],
        [2, 1, 2],
        [2, 1, 2],
      ];

      expect(checkDraw(grid)).toBe(false);
    });

    it('should return false for empty grid', () => {
      const grid = createEmptyGrid();
      expect(checkDraw(grid)).toBe(false);
    });
  });
});

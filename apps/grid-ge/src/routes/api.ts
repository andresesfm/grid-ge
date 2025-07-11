import express, { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  createPlayer,
  getPlayerById,
  createGame as dbCreateGame,
  getGameById,
  joinGame as dbJoinGame,
  makeMove as dbMakeMove,
  getLeaderboard,
} from '../db/database';
import {
  createEmptyGrid,
  isMoveValid,
  makeMove as coreMarkMove,
  checkWin,
  checkDraw,
  GameStatus,
} from '../core/game-logic';

const router = express.Router();

// Player Management
router.post('/players', async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.body;

    if (!name || typeof name !== 'string' || name.trim().length === 0) {
      res
        .status(400)
        .json({ error: 'Name is required and must be a non-empty string' });
      return;
    }

    const player = await createPlayer(name.trim());
    res.status(201).json({
      id: player.id,
      name: player.name,
    });
  } catch (error: unknown) {
    if (
      error instanceof Error &&
      error.message === 'Player with this name already exists'
    ) {
      res.status(409).json({ error: 'Player with this name already exists' });
      return;
    }
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Game Session Management
router.post('/games', async (req: Request, res: Response): Promise<void> => {
  try {
    const { playerId } = req.body;

    if (!playerId || typeof playerId !== 'number') {
      res
        .status(400)
        .json({ error: 'playerId is required and must be a number' });
      return;
    }

    const player = await getPlayerById(playerId);
    if (!player) {
      res.status(404).json({ error: 'Player not found' });
      return;
    }

    const gameId = uuidv4();
    const grid = createEmptyGrid();
    const game = await dbCreateGame(playerId, gameId, grid);

    res.status(201).json({
      gameId: game.id,
      status: game.status,
      grid: JSON.parse(game.grid),
    });
  } catch {
    res.status(500).json({ error: 'Internal server error' });
  }
});

router.post(
  '/games/:gameId/join',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId } = req.body;

      if (!playerId || typeof playerId !== 'number') {
        res
          .status(400)
          .json({ error: 'playerId is required and must be a number' });
        return;
      }

      const player = await getPlayerById(playerId);
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      const game = await getGameById(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      const updatedGame = await dbJoinGame(gameId, playerId);

      res.status(200).json({
        message: 'Player 2 joined. Game is now in progress.',
        gameId: updatedGame.id,
        status: updatedGame.status,
        current_turn_player_id: updatedGame.current_turn_player_id,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Game not found') {
          res.status(404).json({ error: 'Game not found' });
          return;
        }
        if (error.message === 'Game is not in waiting state') {
          res.status(409).json({ error: 'Game is not in waiting state' });
          return;
        }
        if (error.message === 'Cannot join your own game') {
          res.status(409).json({ error: 'Cannot join your own game' });
          return;
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/games/:gameId',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;

      const game = await getGameById(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      res.status(200).json({
        gameId: game.id,
        status: game.status,
        player1_id: game.player1_id,
        player2_id: game.player2_id,
        current_turn_player_id: game.current_turn_player_id,
        winner_id: game.winner_id,
        grid: JSON.parse(game.grid),
      });
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Gameplay
router.post(
  '/games/:gameId/move',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { gameId } = req.params;
      const { playerId, row, col } = req.body;

      if (!playerId || typeof playerId !== 'number') {
        res
          .status(400)
          .json({ error: 'playerId is required and must be a number' });
        return;
      }

      if (typeof row !== 'number' || typeof col !== 'number') {
        res
          .status(400)
          .json({ error: 'row and col are required and must be numbers' });
        return;
      }

      const player = await getPlayerById(playerId);
      if (!player) {
        res.status(404).json({ error: 'Player not found' });
        return;
      }

      const game = await getGameById(gameId);
      if (!game) {
        res.status(404).json({ error: 'Game not found' });
        return;
      }

      if (game.status !== 'in_progress') {
        res.status(403).json({ error: 'Game is not in progress' });
        return;
      }

      if (game.current_turn_player_id !== playerId) {
        res.status(403).json({ error: 'Not your turn' });
        return;
      }

      const currentGrid = JSON.parse(game.grid);

      if (!isMoveValid(currentGrid, row, col)) {
        res
          .status(409)
          .json({
            error: 'Invalid move: cell is already occupied or out of bounds',
          });
        return;
      }

      // Determine player number (1 or 2) for the grid
      const playerNumber = game.player1_id === playerId ? 1 : 2;
      const newGrid = coreMarkMove(currentGrid, row, col, playerNumber);

      // Check game state
      let newStatus: GameStatus = 'in_progress';
      let winnerId: number | null = null;

      if (checkWin(newGrid, playerNumber)) {
        newStatus = 'win';
        winnerId = playerId;
      } else if (checkDraw(newGrid)) {
        newStatus = 'draw';
      }

      const result = await dbMakeMove(
        gameId,
        playerId,
        row,
        col,
        newGrid,
        newStatus,
        winnerId
      );

      res.status(200).json({
        message: 'Move accepted.',
        gameId: result.game.id,
        newStatus: result.game.status,
        winner_id: result.game.winner_id,
      });
    } catch (error: unknown) {
      if (error instanceof Error) {
        if (error.message === 'Game not found') {
          res.status(404).json({ error: 'Game not found' });
          return;
        }
        if (error.message === 'Game is not in progress') {
          res.status(403).json({ error: 'Game is not in progress' });
          return;
        }
        if (error.message === 'Not your turn') {
          res.status(403).json({ error: 'Not your turn' });
          return;
        }
        if (error.message === 'Cell is already occupied') {
          res.status(409).json({ error: 'Cell is already occupied' });
          return;
        }
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// Leaderboard
router.get(
  '/leaderboard',
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { by } = req.query;

      if (!by || (by !== 'wins' && by !== 'efficiency')) {
        res
          .status(400)
          .json({
            error:
              'Query parameter "by" is required and must be "wins" or "efficiency"',
          });
        return;
      }

      const leaderboard = await getLeaderboard(by);
      res.status(200).json(leaderboard);
    } catch {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;

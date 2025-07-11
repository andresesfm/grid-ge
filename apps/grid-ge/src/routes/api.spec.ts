import request from 'supertest';
import express from 'express';
import { initializeDatabase, createTables } from '../db/database';
import apiRoutes from '../routes/api';

// Test app setup
const app = express();
app.use(express.json());
app.use('/api', apiRoutes);

describe('API Integration Tests', () => {
  beforeAll(async () => {
    // Initialize in-memory database for tests
    initializeDatabase(':memory:');
    await createTables();
  });

  afterAll(async () => {
    // Close database connection
    const { getDatabase } = require('../db/database');
    const db = getDatabase();
    await db.destroy();
  });

  beforeEach(async () => {
    // Clean up database before each test
    const { getDatabase } = require('../db/database');
    const db = getDatabase();
    await db.raw('DELETE FROM moves');
    await db.raw('DELETE FROM games');
    await db.raw('DELETE FROM players');
    // Reset autoincrement
    await db.raw(
      'DELETE FROM sqlite_sequence WHERE name IN ("players", "moves")'
    );
  });

  describe('Player Management', () => {
    describe('POST /api/players', () => {
      it('should create a new player', async () => {
        const response = await request(app)
          .post('/api/players')
          .send({ name: 'TestPlayer1' });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          id: expect.any(Number),
          name: 'TestPlayer1',
        });
      });

      it('should return 400 for missing name', async () => {
        const response = await request(app).post('/api/players').send({});

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(
          'Name is required and must be a non-empty string'
        );
      });

      it('should return 409 for duplicate name', async () => {
        await request(app)
          .post('/api/players')
          .send({ name: 'DuplicatePlayer' });

        const response = await request(app)
          .post('/api/players')
          .send({ name: 'DuplicatePlayer' });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe(
          'Player with this name already exists'
        );
      });
    });
  });

  describe('Game Management', () => {
    let player1Id: number;
    let player2Id: number;

    beforeEach(async () => {
      const player1Response = await request(app)
        .post('/api/players')
        .send({ name: 'Player1' });
      player1Id = player1Response.body.id;

      const player2Response = await request(app)
        .post('/api/players')
        .send({ name: 'Player2' });
      player2Id = player2Response.body.id;
    });

    describe('POST /api/games', () => {
      it('should create a new game', async () => {
        const response = await request(app)
          .post('/api/games')
          .send({ playerId: player1Id });

        expect(response.status).toBe(201);
        expect(response.body).toEqual({
          gameId: expect.any(String),
          status: 'waiting',
          grid: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        });
      });

      it('should return 404 for non-existent player', async () => {
        const response = await request(app)
          .post('/api/games')
          .send({ playerId: 99999 });

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Player not found');
      });
    });

    describe('POST /api/games/:gameId/join', () => {
      let gameId: string;

      beforeEach(async () => {
        const gameResponse = await request(app)
          .post('/api/games')
          .send({ playerId: player1Id });
        gameId = gameResponse.body.gameId;
      });

      it('should allow second player to join', async () => {
        const response = await request(app)
          .post(`/api/games/${gameId}/join`)
          .send({ playerId: player2Id });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: 'Player 2 joined. Game is now in progress.',
          gameId,
          status: 'in_progress',
          current_turn_player_id: player1Id,
        });
      });

      it('should prevent player from joining their own game', async () => {
        const response = await request(app)
          .post(`/api/games/${gameId}/join`)
          .send({ playerId: player1Id });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe('Cannot join your own game');
      });
    });

    describe('GET /api/games/:gameId', () => {
      let gameId: string;

      beforeEach(async () => {
        const gameResponse = await request(app)
          .post('/api/games')
          .send({ playerId: player1Id });
        gameId = gameResponse.body.gameId;
      });

      it('should return game state', async () => {
        const response = await request(app).get(`/api/games/${gameId}`);

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          gameId,
          status: 'waiting',
          player1_id: player1Id,
          player2_id: null,
          current_turn_player_id: player1Id,
          winner_id: null,
          grid: [
            [0, 0, 0],
            [0, 0, 0],
            [0, 0, 0],
          ],
        });
      });

      it('should return 404 for non-existent game', async () => {
        const response = await request(app).get('/api/games/non-existent-id');

        expect(response.status).toBe(404);
        expect(response.body.error).toBe('Game not found');
      });
    });
  });

  describe('Gameplay', () => {
    let player1Id: number;
    let player2Id: number;
    let gameId: string;

    beforeEach(async () => {
      // Create players
      const player1Response = await request(app)
        .post('/api/players')
        .send({ name: 'Player1' });
      player1Id = player1Response.body.id;

      const player2Response = await request(app)
        .post('/api/players')
        .send({ name: 'Player2' });
      player2Id = player2Response.body.id;

      // Create and join game
      const gameResponse = await request(app)
        .post('/api/games')
        .send({ playerId: player1Id });
      gameId = gameResponse.body.gameId;

      await request(app)
        .post(`/api/games/${gameId}/join`)
        .send({ playerId: player2Id });
    });

    describe('POST /api/games/:gameId/move', () => {
      it('should allow valid moves', async () => {
        const response = await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player1Id, row: 0, col: 0 });

        expect(response.status).toBe(200);
        expect(response.body).toEqual({
          message: 'Move accepted.',
          gameId,
          newStatus: 'in_progress',
          winner_id: null,
        });
      });

      it('should prevent moves when not player turn', async () => {
        const response = await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player2Id, row: 0, col: 0 });

        expect(response.status).toBe(403);
        expect(response.body.error).toBe('Not your turn');
      });

      it('should prevent moves to occupied cells', async () => {
        // Player 1 makes a move
        await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player1Id, row: 0, col: 0 });

        // Player 2 tries to move to the same cell
        const response = await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player2Id, row: 0, col: 0 });

        expect(response.status).toBe(409);
        expect(response.body.error).toBe(
          'Invalid move: cell is already occupied or out of bounds'
        );
      });

      it('should detect win condition', async () => {
        // Player 1 wins with horizontal line
        await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player1Id, row: 0, col: 0 });
        await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player2Id, row: 1, col: 0 });
        await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player1Id, row: 0, col: 1 });
        await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player2Id, row: 1, col: 1 });

        const response = await request(app)
          .post(`/api/games/${gameId}/move`)
          .send({ playerId: player1Id, row: 0, col: 2 });

        expect(response.status).toBe(200);
        expect(response.body.newStatus).toBe('win');
        expect(response.body.winner_id).toBe(player1Id);
      });
    });
  });

  describe('Leaderboard', () => {
    describe('GET /api/leaderboard', () => {
      it('should return empty leaderboard when no games played', async () => {
        const response = await request(app).get('/api/leaderboard?by=wins');

        expect(response.status).toBe(200);
        expect(response.body).toEqual([]);
      });

      it('should return 400 for missing by parameter', async () => {
        const response = await request(app).get('/api/leaderboard');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(
          'Query parameter "by" is required and must be "wins" or "efficiency"'
        );
      });

      it('should return 400 for invalid by parameter', async () => {
        const response = await request(app).get('/api/leaderboard?by=invalid');

        expect(response.status).toBe(400);
        expect(response.body.error).toBe(
          'Query parameter "by" is required and must be "wins" or "efficiency"'
        );
      });
    });
  });
});

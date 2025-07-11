import knex, { Knex } from 'knex';
import { Grid, GameStatus } from '../core/game-logic';

// Database interfaces
export interface Player {
  id: number;
  name: string;
  created_at: string;
  total_wins: number;
  total_moves_in_wins: number;
}

export interface Game {
  id: string;
  player1_id: number | null;
  player2_id: number | null;
  current_turn_player_id: number | null;
  status: GameStatus;
  winner_id: number | null;
  created_at: string;
  updated_at: string;
  grid: string; // JSON string
  move_count: number;
}

export interface Move {
  id: number;
  game_id: string;
  player_id: number;
  row: number;
  col: number;
  move_number: number;
  created_at: string;
}

export interface LeaderboardEntry {
  rank: number;
  playerId: number;
  name: string;
  value: number;
}

export interface GameWithPlayers extends Omit<Game, 'grid'> {
  grid: Grid; // parsed grid instead of JSON string
  player1?: { id: number; name: string } | null;
  player2?: { id: number; name: string } | null;
}

// Database configuration
let db: Knex;

export function initializeDatabase(databasePath = './grid-ge.db'): Knex {
  db = knex({
    client: 'sqlite3',
    connection: {
      filename: databasePath,
    },
    useNullAsDefault: true,
  });
  return db;
}

export function getDatabase(): Knex {
  if (!db) {
    throw new Error(
      'Database not initialized. Call initializeDatabase() first.'
    );
  }
  return db;
}

// Database setup functions
export async function createTables(): Promise<void> {
  const db = getDatabase();

  // Create players table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS players (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      total_wins INTEGER NOT NULL DEFAULT 0,
      total_moves_in_wins INTEGER NOT NULL DEFAULT 0
    )
  `);

  // Create games table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS games (
      id TEXT PRIMARY KEY,
      player1_id INTEGER,
      player2_id INTEGER,
      current_turn_player_id INTEGER,
      status TEXT NOT NULL,
      winner_id INTEGER,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      grid TEXT NOT NULL,
      move_count INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY(player1_id) REFERENCES players(id),
      FOREIGN KEY(player2_id) REFERENCES players(id),
      FOREIGN KEY(winner_id) REFERENCES players(id)
    )
  `);

  // Create moves table
  await db.raw(`
    CREATE TABLE IF NOT EXISTS moves (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      game_id TEXT NOT NULL,
      player_id INTEGER NOT NULL,
      row INTEGER NOT NULL,
      col INTEGER NOT NULL,
      move_number INTEGER NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(game_id) REFERENCES games(id),
      FOREIGN KEY(player_id) REFERENCES players(id)
    )
  `);
}

// Player operations
export async function createPlayer(name: string): Promise<Player> {
  const db = getDatabase();

  try {
    const result = await db.raw(
      'INSERT INTO players (name) VALUES (?) RETURNING *',
      [name]
    );
    return result[0];
  } catch (error: unknown) {
    console.error('Database error in createPlayer:', error);
    throw new Error('Could not create player due to a database error.');
  }
}

export async function getPlayerById(id: number): Promise<Player | null> {
  const db = getDatabase();
  const result = await db.raw('SELECT * FROM players WHERE id = ?', [id]);
  return result[0] || null;
}

export async function getPlayerByName(name: string): Promise<Player | null> {
  const db = getDatabase();
  const result = await db.raw('SELECT * FROM players WHERE name = ?', [name]);
  return result[0] || null;
}

// Game operations
export async function createGame(
  playerId: number,
  gameId: string,
  grid: Grid
): Promise<Game> {
  const db = getDatabase();

  const result = await db.raw(
    `
    INSERT INTO games (id, player1_id, status, grid, current_turn_player_id) 
    VALUES (?, ?, 'waiting', ?, ?) 
    RETURNING *
  `,
    [gameId, playerId, JSON.stringify(grid), playerId]
  );

  return result[0];
}

export async function getGameById(
  gameId: string
): Promise<GameWithPlayers | null> {
  const db = getDatabase();

  try {
    // First, get the basic game data
    const gameResult = await db.raw('SELECT * FROM games WHERE id = ?', [
      gameId,
    ]);
    const game = gameResult[0];

    if (!game) {
      return null;
    }

    // Get player 1 info
    let player1 = null;
    if (game.player1_id) {
      const p1Result = await db.raw('SELECT * FROM players WHERE id = ?', [
        game.player1_id,
      ]);
      if (p1Result[0]) {
        player1 = { id: game.player1_id, name: p1Result[0].name };
      }
    }

    // Get player 2 info
    let player2 = null;
    if (game.player2_id) {
      const p2Result = await db.raw('SELECT * FROM players WHERE id = ?', [
        game.player2_id,
      ]);
      if (p2Result[0]) {
        player2 = { id: game.player2_id, name: p2Result[0].name };
      }
    }

    // Return the enhanced game object
    const result = {
      ...game,
      grid: JSON.parse(game.grid),
    };

    if (player1) {
      result.player1 = player1;
    }

    if (player2) {
      result.player2 = player2;
    }

    return result;
  } catch (error) {
    console.error('Error in getGameById:', error);
    throw error;
  }
}

export async function joinGame(
  gameId: string,
  playerId: number
): Promise<Game> {
  const db = getDatabase();

  return await db.transaction(async (trx) => {
    // Get the game (SQLite doesn't support FOR UPDATE, so we'll use BEGIN EXCLUSIVE)
    const game = await trx.raw('SELECT * FROM games WHERE id = ?', [gameId]);
    const gameData = game[0];

    if (!gameData) {
      throw new Error('Game not found');
    }

    if (gameData.status !== 'waiting') {
      throw new Error('Game is not in waiting state');
    }

    if (gameData.player1_id === playerId) {
      throw new Error('Cannot join your own game');
    }

    // Update the game
    const result = await trx.raw(
      `
      UPDATE games 
      SET player2_id = ?, status = 'in_progress', updated_at = CURRENT_TIMESTAMP 
      WHERE id = ? 
      RETURNING *
    `,
      [playerId, gameId]
    );

    return result[0];
  });
}

export async function makeMove(
  gameId: string,
  playerId: number,
  row: number,
  col: number,
  newGrid: Grid,
  newStatus: GameStatus,
  winnerId: number | null = null
): Promise<{ game: Game; moveNumber: number }> {
  const db = getDatabase();

  return await db.transaction(async (trx) => {
    // Get the game
    const gameResult = await trx.raw('SELECT * FROM games WHERE id = ?', [
      gameId,
    ]);
    const game = gameResult[0];

    if (!game) {
      throw new Error('Game not found');
    }

    if (game.status !== 'in_progress') {
      throw new Error('Game is not in progress');
    }

    if (game.current_turn_player_id !== playerId) {
      throw new Error('Not your turn');
    }

    const currentGrid = JSON.parse(game.grid);
    if (currentGrid[row][col] !== 0) {
      throw new Error('Cell is already occupied');
    }

    const moveNumber = game.move_count + 1;
    const nextPlayerId =
      game.player1_id === playerId ? game.player2_id : game.player1_id;

    // Update game
    const updatedGameResult = await trx.raw(
      `
      UPDATE games 
      SET grid = ?, 
          move_count = ?, 
          current_turn_player_id = ?,
          status = ?,
          winner_id = ?,
          updated_at = CURRENT_TIMESTAMP
      WHERE id = ? 
      RETURNING *
    `,
      [
        JSON.stringify(newGrid),
        moveNumber,
        newStatus === 'in_progress'
          ? nextPlayerId
          : game.current_turn_player_id,
        newStatus,
        winnerId,
        gameId,
      ]
    );

    // Record the move
    await trx.raw(
      `
      INSERT INTO moves (game_id, player_id, row, col, move_number)
      VALUES (?, ?, ?, ?, ?)
    `,
      [gameId, playerId, row, col, moveNumber]
    );

    // If there's a winner, update player stats
    if (winnerId) {
      await trx.raw(
        `
        UPDATE players 
        SET total_wins = total_wins + 1,
            total_moves_in_wins = total_moves_in_wins + ?
        WHERE id = ?
      `,
        [moveNumber, winnerId]
      );
    }

    return { game: updatedGameResult[0], moveNumber };
  });
}

// Leaderboard operations
export async function getLeaderboard(
  by: 'wins' | 'efficiency'
): Promise<LeaderboardEntry[]> {
  const db = getDatabase();

  let query: string;
  if (by === 'wins') {
    query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY total_wins DESC) as rank,
        id as playerId,
        name,
        total_wins as value
      FROM players 
      WHERE total_wins > 0
      ORDER BY total_wins DESC 
      LIMIT 3
    `;
  } else {
    query = `
      SELECT 
        ROW_NUMBER() OVER (ORDER BY (CAST(total_moves_in_wins AS FLOAT) / total_wins) ASC) as rank,
        id as playerId,
        name,
        ROUND(CAST(total_moves_in_wins AS FLOAT) / total_wins, 2) as value
      FROM players 
      WHERE total_wins > 0
      ORDER BY (CAST(total_moves_in_wins AS FLOAT) / total_wins) ASC 
      LIMIT 3
    `;
  }

  const result = await db.raw(query);
  return result;
}

export async function getGamesByStatus(status: GameStatus): Promise<Game[]> {
  const db = getDatabase();

  const games = await db('games')
    .leftJoin('players as p1', 'games.player1_id', 'p1.id')
    .leftJoin('players as p2', 'games.player2_id', 'p2.id')
    .select('games.*', 'p1.name as player1_name', 'p2.name as player2_name')
    .where('games.status', status)
    .orderBy('games.created_at', 'desc');

  return games.map((game) => ({
    ...game,
    grid: JSON.parse(game.grid),
    player1: game.player1_name
      ? { id: game.player1_id, name: game.player1_name }
      : undefined,
    player2: game.player2_name
      ? { id: game.player2_id, name: game.player2_name }
      : undefined,
  }));
}

export async function getGamesByPlayerId(playerId: number): Promise<Game[]> {
  const db = getDatabase();

  const games = await db('games')
    .leftJoin('players as p1', 'games.player1_id', 'p1.id')
    .leftJoin('players as p2', 'games.player2_id', 'p2.id')
    .select('games.*', 'p1.name as player1_name', 'p2.name as player2_name')
    .where('games.player1_id', playerId)
    .orWhere('games.player2_id', playerId)
    .orderBy('games.updated_at', 'desc');

  return games.map((game) => ({
    ...game,
    grid: JSON.parse(game.grid),
    player1: game.player1_name
      ? { id: game.player1_id, name: game.player1_name }
      : undefined,
    player2: game.player2_name
      ? { id: game.player2_id, name: game.player2_name }
      : undefined,
  }));
}

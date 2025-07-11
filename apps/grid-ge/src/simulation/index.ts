#!/usr/bin/env node

/**
 * Grid-GE Game Simulation Script
 * Simulates concurrent multiplayer games and reports results
 */

import axios, { AxiosInstance } from 'axios';

interface SimulationConfig {
  numPlayers: number;
  concurrentGames: number;
  apiBaseUrl: string;
}

interface Player {
  id: number;
  name: string;
}

interface Game {
  gameId: string;
  status: string;
  grid: number[][];
}

interface GameState {
  gameId: string;
  status: string;
  player1_id: number;
  player2_id: number;
  current_turn_player_id: number;
  winner_id: number | null;
  grid: number[][];
}

interface LeaderboardEntry {
  rank: number;
  playerId: number;
  name: string;
  value: number;
}

class GameSimulator {
  private api: AxiosInstance;
  private config: SimulationConfig;
  private players: Player[] = [];

  constructor(config: SimulationConfig) {
    this.config = config;
    this.api = axios.create({
      baseURL: config.apiBaseUrl,
      timeout: 10000,
    });
  }

  async run(): Promise<void> {
    console.log('🎮 Starting Grid-GE Simulation');
    console.log(`Players: ${this.config.numPlayers}`);
    console.log(`Concurrent Games: ${this.config.concurrentGames}`);
    console.log(`API URL: ${this.config.apiBaseUrl}`);
    console.log('');

    try {
      // Step 1: Create players
      await this.createPlayers();

      // Step 2: Run concurrent games
      await this.runConcurrentGames();

      // Step 3: Display leaderboard
      await this.displayLeaderboard();

      console.log('✅ Simulation completed successfully!');
    } catch (error) {
      console.error('❌ Simulation failed:', error);
      process.exit(1);
    }
  }

  private async createPlayers(): Promise<void> {
    console.log('👥 Creating players...');

    const playerPromises = Array.from(
      { length: this.config.numPlayers },
      async (_, i) => {
        const timestamp = Date.now();
        const playerName = `Player${i + 1}_${timestamp}`;
        try {
          const response = await this.api.post('/players', {
            name: playerName,
          });
          return response.data as Player;
        } catch (error: unknown) {
          if (error && typeof error === 'object' && 'response' in error) {
            const axiosError = error as { response?: { status?: number } };
            if (axiosError.response?.status === 409) {
              // Player already exists, fetch by name
              throw new Error(`Player ${playerName} already exists`);
            }
          }
          throw error;
        }
      }
    );

    this.players = await Promise.all(playerPromises);
    console.log(`✅ Created ${this.players.length} players`);
  }

  private async runConcurrentGames(): Promise<void> {
    console.log(
      `🎯 Starting ${this.config.concurrentGames} concurrent games...`
    );

    const gamePromises = Array.from(
      { length: this.config.concurrentGames },
      (_, i) => this.simulateGame(i + 1)
    );

    const results = await Promise.allSettled(gamePromises);

    const successful = results.filter((r) => r.status === 'fulfilled').length;
    const failed = results.filter((r) => r.status === 'rejected').length;

    console.log(
      `✅ Games completed: ${successful} successful, ${failed} failed`
    );

    if (failed > 0) {
      console.log('Failed games:');
      results.forEach((result, i) => {
        if (result.status === 'rejected') {
          console.log(`  Game ${i + 1}: ${result.reason}`);
        }
      });
    }
  }

  private async simulateGame(gameNumber: number): Promise<string> {
    try {
      // Randomly select two different players
      const player1 =
        this.players[Math.floor(Math.random() * this.players.length)];
      let player2 =
        this.players[Math.floor(Math.random() * this.players.length)];

      // Ensure different players
      while (player2.id === player1.id && this.players.length > 1) {
        player2 = this.players[Math.floor(Math.random() * this.players.length)];
      }

      if (player1.id === player2.id) {
        throw new Error('Not enough players to start a game');
      }

      // Create game
      const gameResponse = await this.api.post('/games', {
        playerId: player1.id,
      });
      const game: Game = gameResponse.data;

      // Player 2 joins
      await this.api.post(`/games/${game.gameId}/join`, {
        playerId: player2.id,
      });

      // Play the game
      await this.playGame(game.gameId, player1.id, player2.id);

      // Verify final state
      await this.verifyGameState(game.gameId);

      return `Game ${gameNumber} completed`;
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Game ${gameNumber} failed: ${message}`);
    }
  }

  private async playGame(
    gameId: string,
    player1Id: number,
    player2Id: number
  ): Promise<void> {
    const players = [player1Id, player2Id];
    let currentPlayerIndex = 0;
    let moveCount = 0;
    const maxMoves = 9; // Maximum possible moves in grid-ge

    while (moveCount < maxMoves) {
      const currentPlayerId = players[currentPlayerIndex];

      // Get current game state
      const gameStateResponse = await this.api.get(`/games/${gameId}`);
      const gameState: GameState = gameStateResponse.data;

      // Check if game is finished
      if (gameState.status === 'win' || gameState.status === 'draw') {
        break;
      }

      // Make a random valid move
      const move = this.findRandomValidMove(gameState.grid);
      if (!move) {
        break; // No valid moves left
      }

      try {
        await this.api.post(`/games/${gameId}/move`, {
          playerId: currentPlayerId,
          row: move.row,
          col: move.col,
        });

        moveCount++;
        currentPlayerIndex = (currentPlayerIndex + 1) % 2;
      } catch (error: unknown) {
        if (error && typeof error === 'object' && 'response' in error) {
          const axiosError = error as {
            response?: { status?: number; data?: { error?: string } };
          };
          if (
            axiosError.response?.status === 403 &&
            axiosError.response?.data?.error === 'Not your turn'
          ) {
            // Switch to other player
            currentPlayerIndex = (currentPlayerIndex + 1) % 2;
            continue;
          }
        }
        throw error;
      }
    }
  }

  private findRandomValidMove(
    grid: number[][]
  ): { row: number; col: number } | null {
    const validMoves: { row: number; col: number }[] = [];

    for (let row = 0; row < 3; row++) {
      for (let col = 0; col < 3; col++) {
        if (grid[row][col] === 0) {
          validMoves.push({ row, col });
        }
      }
    }

    if (validMoves.length === 0) {
      return null;
    }

    return validMoves[Math.floor(Math.random() * validMoves.length)];
  }

  private async verifyGameState(gameId: string): Promise<void> {
    const response = await this.api.get(`/games/${gameId}`);
    const gameState: GameState = response.data;

    if (gameState.status === 'in_progress') {
      console.warn(`⚠️  Game ${gameId} is still in progress after simulation`);
    }
  }

  private async displayLeaderboard(): Promise<void> {
    console.log('');
    console.log('🏆 LEADERBOARD');
    console.log('');

    try {
      // Get leaderboard by wins
      const winsResponse = await this.api.get('/leaderboard?by=wins');
      const winLeaderboard = winsResponse.data;

      console.log('📊 Top 3 Players by Wins:');
      if (winLeaderboard.length === 0) {
        console.log('  No games completed yet');
      } else {
        winLeaderboard.forEach((entry: LeaderboardEntry) => {
          console.log(`  ${entry.rank}. ${entry.name} - ${entry.value} wins`);
        });
      }

      console.log('');

      // Get leaderboard by efficiency
      const efficiencyResponse = await this.api.get(
        '/leaderboard?by=efficiency'
      );
      const efficiencyLeaderboard = efficiencyResponse.data;

      console.log('⚡ Top 3 Players by Efficiency (avg moves per win):');
      if (efficiencyLeaderboard.length === 0) {
        console.log('  No games completed yet');
      } else {
        efficiencyLeaderboard.forEach((entry: LeaderboardEntry) => {
          console.log(
            `  ${entry.rank}. ${entry.name} - ${entry.value} avg moves`
          );
        });
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
  }
}

// CLI interface
function parseArgs(): SimulationConfig {
  const args = process.argv.slice(2);

  const config: SimulationConfig = {
    numPlayers: 4,
    concurrentGames: 10,
    apiBaseUrl: 'http://localhost:3333/api',
  };

  for (let i = 0; i < args.length; i += 2) {
    const key = args[i];
    const value = args[i + 1];

    switch (key) {
      case '--players':
        config.numPlayers = parseInt(value, 10);
        break;
      case '--games':
        config.concurrentGames = parseInt(value, 10);
        break;
      case '--url':
        config.apiBaseUrl = value;
        break;
      case '--help':
        console.log('Usage: simulation [options]');
        console.log('');
        console.log('Options:');
        console.log(
          '  --players <num>    Number of players to create (default: 4)'
        );
        console.log(
          '  --games <num>      Number of concurrent games (default: 10)'
        );
        console.log(
          '  --url <url>        API base URL (default: http://localhost:3333/api)'
        );
        console.log('  --help             Show this help message');
        process.exit(0);
        break;
    }
  }

  return config;
}

// Main execution
if (require.main === module) {
  const config = parseArgs();
  const simulator = new GameSimulator(config);
  simulator.run().catch(console.error);
}

export default GameSimulator;

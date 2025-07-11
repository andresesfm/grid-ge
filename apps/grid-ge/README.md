# Grid-GE Multiplayer Game API

A RESTful API for managing multiplayer grid-ge games built with Express.js, SQLite, and Nx monorepo structure.

## Features

- **Player Management**: Create and manage players
- **Game Sessions**: Create games, join waiting games, and track game state
- **Gameplay**: Make moves with real-time validation and win/draw detection
- **Leaderboard**: Track player performance by wins and efficiency
- **Concurrency**: Safe concurrent game handling with database transactions
- **Simulation**: Automated testing script for concurrent gameplay

## Project Structure

```
apps/grid-ge/
├── src/
│   ├── main.ts              # Express server entry point
│   ├── core/
│   │   ├── game-logic.ts    # Pure game logic functions
│   │   └── game-logic.spec.ts # Unit tests for game logic
│   ├── db/
│   │   └── database.ts      # Database operations and schema
│   ├── routes/
│   │   ├── api.ts           # REST API route handlers
│   │   └── api.spec.ts      # Integration tests
│   └── simulation/
│       └── index.ts         # Simulation script for testing
```

## Database Schema

### Players Table
- `id`: Primary key (auto-increment)
- `name`: Unique player name
- `total_wins`: Number of games won
- `total_moves_in_wins`: Total moves used in winning games (for efficiency calculation)

### Games Table
- `id`: UUID primary key
- `player1_id`, `player2_id`: Player references
- `current_turn_player_id`: Whose turn it is
- `status`: 'waiting', 'in_progress', 'win', 'draw'
- `winner_id`: Winner player ID (if game finished)
- `grid`: JSON string of 3x3 game board
- `move_count`: Number of moves made

### Moves Table
- Records every move made in every game for historical tracking

## API Endpoints

### Player Management

**POST /api/players**
```json
{
  "name": "PlayerName"
}
```
Response: `{ "id": 1, "name": "PlayerName" }`

### Game Management

**POST /api/games**
```json
{
  "playerId": 1
}
```
Response: `{ "gameId": "uuid", "status": "waiting", "grid": [[0,0,0],[0,0,0],[0,0,0]] }`

**POST /api/games/:gameId/join**
```json
{
  "playerId": 2
}
```

**GET /api/games/:gameId**
Returns current game state including grid, players, and turn information.

### Gameplay

**POST /api/games/:gameId/move**
```json
{
  "playerId": 1,
  "row": 0,
  "col": 1
}
```

### Leaderboard

**GET /api/leaderboard?by=wins**
Returns top 3 players by total wins.

**GET /api/leaderboard?by=efficiency**
Returns top 3 players by average moves per win (lower is better).

## Getting Started

### Prerequisites
- Node.js (18+)
- npm

### Installation
1. Install dependencies:
   ```bash
   npm install
   ```

2. Build the project:
   ```bash
   npx nx build grid-ge
   ```

3. Start the server:
   ```bash
   npx nx serve grid-ge
   ```

The API will be available at `http://localhost:3333`

### Running Tests

```bash
# Run all tests
npx nx test grid-ge

# Run unit tests only
npx nx test grid-ge --testPathPattern=game-logic.spec

# Run integration tests only
npx nx test grid-ge --testPathPattern=api.spec
```

### Running Simulation

The simulation script creates players and runs concurrent games to test the system:

```bash
# Run simulation with default settings (4 players, 10 games)
npx ts-node apps/grid-ge/src/simulation/index.ts

# Custom settings
npx ts-node apps/grid-ge/src/simulation/index.ts --players 6 --games 20

# Help
npx ts-node apps/grid-ge/src/simulation/index.ts --help
```

## Game Rules

- 3x3 grid with positions indexed from 0-2 for both row and col
- Player 1 uses marker "1", Player 2 uses marker "2"
- Players alternate turns starting with Player 1
- Win conditions: 3 in a row horizontally, vertically, or diagonally
- Draw condition: All cells filled with no winner

## Concurrency Handling

- Database transactions ensure atomicity of game state updates
- Move validation prevents race conditions
- Each game processes moves serially while allowing concurrent games

## Health Check

```bash
curl http://localhost:3333/health
```

## Example Game Flow

```bash
# Create players
curl -X POST http://localhost:3333/api/players -H "Content-Type: application/json" -d '{"name": "Alice"}'
curl -X POST http://localhost:3333/api/players -H "Content-Type: application/json" -d '{"name": "Bob"}'

# Create game
curl -X POST http://localhost:3333/api/games -H "Content-Type: application/json" -d '{"playerId": 1}'

# Join game (use gameId from previous response)
curl -X POST http://localhost:3333/api/games/GAME_ID/join -H "Content-Type: application/json" -d '{"playerId": 2}'

# Make moves
curl -X POST http://localhost:3333/api/games/GAME_ID/move -H "Content-Type: application/json" -d '{"playerId": 1, "row": 0, "col": 0}'
curl -X POST http://localhost:3333/api/games/GAME_ID/move -H "Content-Type: application/json" -d '{"playerId": 2, "row": 1, "col": 1}'

# Check leaderboard
curl "http://localhost:3333/api/leaderboard?by=wins"
```

## Development

The project uses:
- **Express.js** for the REST API
- **SQLite** with Knex.js for database operations
- **TypeScript** for type safety
- **Jest** for testing
- **Nx** for monorepo management
- **UUID** for game ID generation

## License

MIT

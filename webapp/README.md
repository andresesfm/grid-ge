# Grid-GE Web Application

A modern React TypeScript frontend for the Grid-GE multiplayer game, built with Nx monorepo structure.

## 🚀 Features

### 🎮 Complete Game Experience
- **Welcome Screen**: Player registration with name validation
- **Game Lobby**: Create games, join waiting games, view active games
- **Live Gameplay**: Real-time grid-based game with optimistic updates
- **Leaderboard**: Player rankings by wins and efficiency

### 🎨 Modern UI/UX Design
- **Dark Theme**: Sleek charcoal background (#1A1A1A) with electric blue accents
- **Player Colors**: Distinct colors for players (Neon Teal & Hot Pink)
- **Smooth Animations**: Framer Motion powered transitions and micro-interactions
- **Responsive Design**: Mobile-first approach with adaptive layouts

### 🏗️ Technical Architecture
- **React 18** with TypeScript for type safety
- **Zustand** for lightweight state management
- **React Router DOM** for navigation
- **Framer Motion** for animations
- **Vite** for fast development and builds
- **Clean Architecture** with separate concerns (components, views, state, utils)

## 📁 Project Structure

```
webapp/src/
├── components/          # Reusable UI components
│   ├── Button.tsx      # Primary action component with loading states
│   ├── GridCell.tsx    # Individual game grid cell with animations
│   ├── GameBoard.tsx   # 3x3 game grid layout
│   ├── PlayerTag.tsx   # Player info with turn indicators
│   ├── Modal.tsx       # Game over dialogs
│   ├── ToastNotification.tsx  # Non-blocking notifications
│   └── index.ts        # Component exports
├── views/              # Main application screens
│   ├── WelcomeView.tsx # Player name entry
│   ├── LobbyView.tsx   # Game management hub
│   ├── GameView.tsx    # Active gameplay screen
│   ├── LeaderboardView.tsx  # Player rankings
│   └── index.ts        # View exports
├── state/              # Global state management
│   └── gameStore.ts    # Zustand store for game state
├── utils/              # Utility functions
│   ├── api.ts          # API client for backend communication
│   └── gameUtils.ts    # Game logic helpers
├── types/              # TypeScript type definitions
│   └── index.ts        # Shared interfaces and types
├── app/
│   └── app.tsx         # Main app component with routing
├── main.tsx            # Application entry point
└── styles.css          # Global design system styles
```

## 🎯 Component Specifications

### Button Component
- **Variants**: Primary (blue) and Secondary (outlined)
- **States**: Default, Hover, Disabled, Loading
- **Animations**: Scale on hover/tap, loading spinner

### GridCell Component
- **States**: Empty, Filled, Winning, Disabled
- **Interactions**: Hover targeting, click feedback
- **Animations**: Mark appearance, winning cell pulse

### GameBoard Component
- **Layout**: 3x3 CSS Grid with responsive sizing
- **Features**: Click handling, winning line highlighting
- **Animations**: Board entrance transition

### PlayerTag Component
- **Display**: Player name, mark (X/O), status
- **Indicators**: Current turn glow, pulse animation
- **Colors**: Player-specific theming

### Modal Component
- **Purpose**: Game over notifications
- **Features**: Keyboard (ESC) and click-outside closing
- **Animations**: Backdrop fade, content scale

### ToastNotification Component
- **Types**: Success, Error, Info with color coding
- **Behavior**: Auto-dismiss, manual close, slide animations
- **Position**: Top-right corner (mobile: full width)

## 🎨 Design System

### Color Palette
```css
--bg-primary: #1A1A1A      /* Dark charcoal background */
--text-primary: #F5F5F5     /* Off-white text */
--accent-blue: #007BFF      /* Electric blue for actions */
--player-teal: #39CCCC      /* Player 1 (X) color */
--player-pink: #F012BE      /* Player 2 (O) color */
```

### Typography
- **Font**: Inter (clean, geometric sans-serif)
- **Weights**: 400 (regular), 500 (medium), 600 (semi-bold), 700 (bold)
- **Responsive scaling** with mobile optimizations

### Spacing & Layout
- **System**: rem-based spacing scale (0.25rem to 3rem)
- **Grid**: Flexbox and CSS Grid for layouts
- **Breakpoint**: 768px for mobile/desktop distinction

## 🔄 Application Flow

### 1. Welcome Screen (`/`)
1. User enters unique player name
2. Validation prevents empty/duplicate names
3. API call creates player account
4. Success → Navigate to Lobby
5. Conflict (409) → Show "Name taken" error

### 2. Game Lobby (`/lobby`)
1. Display welcome message with player name
2. Poll for waiting games every 5 seconds
3. Show user's active games
4. Actions:
   - Create new game → Navigate to game
   - Join waiting game → Navigate to game
   - View active game → Navigate to game
   - Access leaderboard

### 3. Game View (`/game/:gameId`)
1. Load game state, poll every 2.5 seconds
2. Display both players with turn indicators
3. Interactive game board (only on player's turn)
4. Optimistic updates for immediate feedback
5. Game over modal with results
6. Return to lobby option

### 4. Leaderboard (`/leaderboard`)
1. Toggle between "By Wins" and "By Efficiency"
2. Show top 3 players with rankings
3. Loading states and empty state handling
4. Navigation back to lobby

## 🌐 API Integration

### Endpoints Used
- `POST /api/players` - Create player account
- `POST /api/games` - Create new game
- `POST /api/games/:id/join` - Join waiting game
- `GET /api/games/:id` - Get game state
- `POST /api/games/:id/move` - Make game move
- `GET /api/leaderboard?by=wins|efficiency` - Get rankings

### Error Handling
- Network errors with toast notifications
- 404 game not found → Redirect to lobby
- 409 name conflict → Inline validation error
- Move validation errors → Remove optimistic updates

## 🚀 Getting Started

### Prerequisites
- Node.js 18+
- Backend API running on `http://localhost:3333`

### Development
```bash
# Start development server
npx nx serve webapp
# Accessible at http://localhost:4200

# Build for production
npx nx build webapp

# Run tests
npx nx test webapp

# Lint code
npx nx lint webapp
```

### Production
```bash
# Build optimized bundle
npx nx build webapp

# Serve built files
npx nx preview webapp
```

## 📱 Responsive Design

### Mobile Optimizations
- Touch-friendly button sizes (min 44px)
- Simplified navigation layouts
- Reduced grid cell sizes
- Stack layouts instead of side-by-side
- Full-width toast notifications

### Desktop Enhancements
- Larger grid cells for mouse precision
- Side-by-side player displays
- Hover effects and animations
- Multi-column game listings

## 🔧 State Management

### Zustand Store (`gameStore`)
```typescript
interface GameStore {
  currentPlayer: Player | null;
  currentGame: Game | null;
  games: Game[];
  leaderboard: LeaderboardEntry[];
  
  // Actions
  setCurrentPlayer, setCurrentGame, setGames, etc.
  
  // Computed
  isPlayerTurn, getPlayerById
}
```

### Local Component State
- Form inputs and validation
- Loading states
- Modal visibility
- UI-specific state

## 🎯 Performance Features

### Optimizations
- **Optimistic Updates**: Immediate UI feedback for moves
- **Polling Strategy**: Different intervals for different data
- **Code Splitting**: Route-based lazy loading ready
- **Animation Performance**: Transform-based animations
- **Bundle Size**: Tree-shaking with Vite

### Caching
- API response caching in store
- Component memoization opportunities
- Static asset optimization

## 🧪 Testing Strategy

### Component Tests
- Button interactions and states
- Grid cell behavior
- Modal functionality
- Toast notifications

### Integration Tests
- Game flow end-to-end
- API error handling
- Navigation patterns
- State management

### E2E Tests
- Complete game sessions
- Multi-player scenarios
- Error recovery

## 🔮 Future Enhancements

### Planned Features
- Real-time WebSocket updates
- Game replay functionality
- Tournament mode
- Player profiles and avatars
- Sound effects and haptic feedback
- Progressive Web App (PWA) features

### Technical Improvements
- React Query for server state
- Service Worker for offline support
- Performance monitoring
- Accessibility (a11y) improvements
- Internationalization (i18n)

## 📄 License

MIT License - see the main project README for details.

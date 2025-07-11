import { Routes, Route, Navigate } from 'react-router-dom';
import { WelcomeView, LobbyView, GameView, LeaderboardView } from '../views';
import { ToastContainer, useToast } from '../components';

export function App() {
  const { toasts, removeToast } = useToast();

  return (
    <div className="app">
      <Routes>
        <Route path="/" element={<WelcomeView />} />
        <Route path="/lobby" element={<LobbyView />} />
        <Route path="/game/:gameId" element={<GameView />} />
        <Route path="/leaderboard" element={<LeaderboardView />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>

      <ToastContainer toasts={toasts} onRemoveToast={removeToast} />
    </div>
  );
}

export default App;

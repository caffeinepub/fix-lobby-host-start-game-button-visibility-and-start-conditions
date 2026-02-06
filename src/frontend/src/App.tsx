import { useState } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import HomePage from './pages/HomePage';
import LobbyPage from './pages/LobbyPage';
import GamePage from './pages/GamePage';
import { Toaster } from '@/components/ui/sonner';

const queryClient = new QueryClient();

export type GameScreen = 'home' | 'lobby' | 'game';

export interface GameContext {
  roomCode: string;
  playerName: string;
  playerId: number | null;
}

function App() {
  const [screen, setScreen] = useState<GameScreen>('home');
  const [gameContext, setGameContext] = useState<GameContext>({
    roomCode: '',
    playerName: '',
    playerId: null,
  });

  const navigateToLobby = (roomCode: string, playerName: string, playerId: number | null) => {
    setGameContext({ roomCode, playerName, playerId });
    setScreen('lobby');
  };

  const navigateToGame = () => {
    setScreen('game');
  };

  const navigateToHome = () => {
    setScreen('home');
    setGameContext({ roomCode: '', playerName: '', playerId: null });
  };

  return (
    <QueryClientProvider client={queryClient}>
      {screen === 'home' && <HomePage onNavigateToLobby={navigateToLobby} />}
      {screen === 'lobby' && (
        <LobbyPage
          gameContext={gameContext}
          setGameContext={setGameContext}
          onNavigateToGame={navigateToGame}
          onNavigateToHome={navigateToHome}
        />
      )}
      {screen === 'game' && (
        <GamePage gameContext={gameContext} onNavigateToHome={navigateToHome} />
      )}
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;

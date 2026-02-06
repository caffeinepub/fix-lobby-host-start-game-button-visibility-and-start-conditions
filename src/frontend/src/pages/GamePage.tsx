import { useEffect, useState } from 'react';
import { useRoomState } from '../hooks/useQueries';
import type { GameContext } from '../App';
import RoleRevealScreen from '../components/RoleRevealScreen';
import DrawingScreen from '../components/DrawingScreen';
import VotingScreen from '../components/VotingScreen';
import ResultsScreen from '../components/ResultsScreen';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface GamePageProps {
  gameContext: GameContext;
  onNavigateToHome: () => void;
}

export default function GamePage({ gameContext, onNavigateToHome }: GamePageProps) {
  const { data: room, isLoading, error } = useRoomState(gameContext.roomCode);
  const [localState, setLocalState] = useState<'roleReveal' | 'drawing' | 'voting' | 'results'>(
    'roleReveal'
  );
  const [isTransitioning, setIsTransitioning] = useState(false);

  useEffect(() => {
    if (room) {
      // Only sync backend state if we're not in a transition
      // This prevents the backend from overriding local state changes
      if (!isTransitioning) {
        if (room.state === 'roleReveal') {
          setLocalState('roleReveal');
        } else if (room.state === 'drawing') {
          setLocalState('drawing');
        } else if (room.state === 'voting') {
          setLocalState('voting');
        } else if (room.state === 'results') {
          setLocalState('results');
        }
      }
    }
  }, [room, isTransitioning]);

  const handleRoleRevealComplete = () => {
    setIsTransitioning(true);
    setLocalState('drawing');
    // Allow backend to catch up, then stop blocking sync
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  };

  const handleDrawingComplete = () => {
    setIsTransitioning(true);
    setLocalState('voting');
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  };

  const handleVotingComplete = () => {
    setIsTransitioning(true);
    setLocalState('results');
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  };

  const handleNextRound = () => {
    setIsTransitioning(true);
    setLocalState('roleReveal');
    setTimeout(() => {
      setIsTransitioning(false);
    }, 2000);
  };

  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Failed to load game state. Please check your connection and try again.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading || !room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading game...</p>
        </div>
      </div>
    );
  }

  const currentPlayer = room.players.find((p) => p.id === gameContext.playerId);

  return (
    <div className="relative">
      {localState === 'roleReveal' && (
        <RoleRevealScreen
          room={room}
          currentPlayer={currentPlayer}
          onComplete={handleRoleRevealComplete}
        />
      )}
      {localState === 'drawing' && (
        <DrawingScreen
          room={room}
          gameContext={gameContext}
          currentPlayer={currentPlayer}
          onComplete={handleDrawingComplete}
        />
      )}
      {localState === 'voting' && (
        <VotingScreen
          room={room}
          gameContext={gameContext}
          currentPlayer={currentPlayer}
          onComplete={handleVotingComplete}
        />
      )}
      {localState === 'results' && (
        <ResultsScreen
          room={room}
          gameContext={gameContext}
          onNavigateToHome={onNavigateToHome}
          onNextRound={handleNextRound}
        />
      )}
      
      {isTransitioning && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm flex items-center justify-center z-50 pointer-events-none">
          <div className="text-center">
            <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p className="text-sm text-muted-foreground">Transitioning...</p>
          </div>
        </div>
      )}
    </div>
  );
}

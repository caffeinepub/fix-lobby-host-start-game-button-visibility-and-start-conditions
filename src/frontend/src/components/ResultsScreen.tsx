import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useStartGame } from '../hooks/useQueries';
import type { Room } from '../backend';
import type { GameContext } from '../App';
import { Trophy, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface ResultsScreenProps {
  room: Room;
  gameContext: GameContext;
  onNavigateToHome: () => void;
  onNextRound: () => void;
}

export default function ResultsScreen({
  room,
  gameContext,
  onNavigateToHome,
  onNextRound,
}: ResultsScreenProps) {
  const [eliminatedPlayer, setEliminatedPlayer] = useState<{
    id: number;
    name: string;
    isSpy: boolean;
  } | null>(null);
  const [gameOver, setGameOver] = useState(false);
  const [spyWins, setSpyWins] = useState(false);

  const startGameMutation = useStartGame();

  useEffect(() => {
    // Calculate who was eliminated
    const voteCounts = new Map<number, number>();
    room.votes.forEach(([_, votedId]) => {
      voteCounts.set(votedId, (voteCounts.get(votedId) || 0) + 1);
    });

    let maxVotes = 0;
    let eliminatedId = 0;
    voteCounts.forEach((count, playerId) => {
      if (count > maxVotes) {
        maxVotes = count;
        eliminatedId = playerId;
      }
    });

    const eliminated = room.players.find((p) => p.id === eliminatedId);
    if (eliminated) {
      setEliminatedPlayer({
        id: eliminated.id,
        name: eliminated.name,
        isSpy: eliminated.isSpy,
      });

      // Check win conditions
      if (eliminated.isSpy) {
        setGameOver(true);
        setSpyWins(false);
      } else {
        const remainingPlayers = room.players.filter(
          (p) => !p.eliminated && p.id !== eliminated.id
        );
        if (remainingPlayers.length <= 2) {
          setGameOver(true);
          setSpyWins(true);
        }
      }
    }
  }, [room]);

  const handleNextRound = async () => {
    if (!gameContext.playerId) {
      toast.error('Player ID not found');
      return;
    }

    try {
      await startGameMutation.mutateAsync({
        roomCode: gameContext.roomCode,
        hostPlayerId: gameContext.playerId,
      });
      onNextRound();
    } catch (error) {
      console.error('Failed to start next round:', error);
      toast.error('Failed to start next round');
    }
  };

  const currentPlayer = room.players.find((p) => p.id === gameContext.playerId);
  const isHost = currentPlayer?.isHost || false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          {gameOver ? (
            <>
              <div className="mx-auto">
                <img
                  src="/assets/generated/victory-icon-transparent.dim_128x128.png"
                  alt="Victory"
                  className="w-32 h-32 mx-auto"
                />
              </div>
              <CardTitle className="text-4xl">
                {spyWins ? (
                  <span className="text-destructive">Spy Wins!</span>
                ) : (
                  <span className="text-primary">Spy Caught! Players Win!</span>
                )}
              </CardTitle>
            </>
          ) : (
            <>
              <div className="mx-auto">
                <AlertCircle className="w-32 h-32 text-muted-foreground" />
              </div>
              <CardTitle className="text-4xl">Round Over</CardTitle>
            </>
          )}
        </CardHeader>
        <CardContent className="space-y-6">
          {eliminatedPlayer && (
            <div className="text-center space-y-4">
              <div className="p-6 bg-muted rounded-lg border-2">
                <p className="text-xl mb-2">
                  <span className="font-bold">{eliminatedPlayer.name}</span> was eliminated
                </p>
                <Badge
                  variant={eliminatedPlayer.isSpy ? 'destructive' : 'secondary'}
                  className="text-lg px-4 py-2"
                >
                  {eliminatedPlayer.isSpy ? 'Was the Spy!' : 'Was Innocent'}
                </Badge>
              </div>

              {!gameOver && (
                <p className="text-muted-foreground">
                  The game continues with a new word and spy...
                </p>
              )}
            </div>
          )}

          <div className="space-y-2">
            {gameOver ? (
              <Button size="lg" className="w-full text-lg h-14" onClick={onNavigateToHome}>
                <Trophy className="w-5 h-5 mr-2" />
                Back to Home
              </Button>
            ) : (
              <>
                {isHost ? (
                  <Button
                    size="lg"
                    className="w-full text-lg h-14"
                    onClick={handleNextRound}
                    disabled={startGameMutation.isPending}
                  >
                    {startGameMutation.isPending ? 'Starting...' : 'Start Next Round'}
                  </Button>
                ) : (
                  <div className="text-center text-muted-foreground">
                    Waiting for host to start next round...
                  </div>
                )}
              </>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

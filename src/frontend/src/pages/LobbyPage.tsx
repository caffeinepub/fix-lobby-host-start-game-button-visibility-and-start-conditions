import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useRoomState, useStartGame } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Crown, Users, Copy, Check, Loader2 } from 'lucide-react';
import type { GameContext } from '../App';

interface LobbyPageProps {
  gameContext: GameContext;
  setGameContext: (context: GameContext) => void;
  onNavigateToGame: () => void;
  onNavigateToHome: () => void;
}

export default function LobbyPage({
  gameContext,
  setGameContext,
  onNavigateToGame,
  onNavigateToHome,
}: LobbyPageProps) {
  const { data: room, isLoading } = useRoomState(gameContext.roomCode);
  const startGameMutation = useStartGame();
  const [copied, setCopied] = useState(false);

  // Resolve current player's ID from room state if not set
  useEffect(() => {
    if (room && gameContext.playerId === null) {
      const player = room.players.find((p) => p.name === gameContext.playerName);
      if (player) {
        setGameContext({
          ...gameContext,
          playerId: player.id,
        });
      }
    }
  }, [room, gameContext, setGameContext]);

  // Navigate to game when state changes to roleReveal
  useEffect(() => {
    if (room && room.state === 'roleReveal') {
      onNavigateToGame();
    }
  }, [room, onNavigateToGame]);

  const handleStartGame = async () => {
    if (!room || gameContext.playerId === null) return;

    try {
      await startGameMutation.mutateAsync({
        roomCode: gameContext.roomCode,
        hostPlayerId: gameContext.playerId,
      });
      toast.success('Game starting!');
    } catch (error) {
      console.error('Failed to start game:', error);
      toast.error('Failed to start game. Please try again.');
    }
  };

  const copyRoomCode = () => {
    navigator.clipboard.writeText(gameContext.roomCode);
    setCopied(true);
    toast.success('Room code copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading lobby...</p>
        </div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5">
        <Card className="max-w-md">
          <CardHeader>
            <CardTitle>Room Not Found</CardTitle>
            <CardDescription>The room you're looking for doesn't exist.</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={onNavigateToHome} className="w-full">
              Back to Home
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Determine current player and host status from room state
  const currentPlayer = room.players.find((p) => p.id === gameContext.playerId);
  const isHost = currentPlayer?.isHost || false;
  const playerCount = room.players.length;
  
  // Game requires 3-10 players to start
  const canStart = playerCount >= 3 && playerCount <= 10;
  const needMorePlayers = playerCount < 3;
  const tooManyPlayers = playerCount > 10;

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">DrawSpy Lobby</h1>
            <Button variant="outline" size="sm" onClick={onNavigateToHome}>
              Leave
            </Button>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl space-y-6">
          <Card className="shadow-xl border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl">Room Code</CardTitle>
              <div className="flex items-center justify-center gap-2 mt-4">
                <div className="text-4xl font-mono font-bold tracking-widest bg-muted px-6 py-3 rounded-lg">
                  {gameContext.roomCode}
                </div>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={copyRoomCode}
                  className="h-12 w-12"
                >
                  {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                </Button>
              </div>
              <CardDescription className="mt-2">
                Share this code with your friends to join
              </CardDescription>
            </CardHeader>
          </Card>

          <Card className="shadow-xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Users className="w-5 h-5" />
                  Players ({playerCount}/10)
                </CardTitle>
                <Badge variant={canStart ? 'default' : 'secondary'}>
                  {canStart ? 'Ready' : needMorePlayers ? `Need ${3 - playerCount} more` : 'Too many'}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {room.players.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center font-semibold">
                        {player.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="font-medium">{player.name}</span>
                    </div>
                    {player.isHost && (
                      <Badge variant="default" className="gap-1">
                        <Crown className="w-3 h-3" />
                        Host
                      </Badge>
                    )}
                  </div>
                ))}
              </div>

              <div className="mt-6 space-y-2">
                {isHost ? (
                  <>
                    <Button
                      size="lg"
                      className="w-full text-lg h-14"
                      onClick={handleStartGame}
                      disabled={!canStart || startGameMutation.isPending}
                    >
                      {startGameMutation.isPending ? (
                        <>
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                          Starting Game...
                        </>
                      ) : (
                        'Start Game'
                      )}
                    </Button>
                    {needMorePlayers && (
                      <p className="text-sm text-center text-muted-foreground">
                        Need {3 - playerCount} more {playerCount === 1 || playerCount === 2 ? 'player' : 'players'} to start
                        (3-10 players required)
                      </p>
                    )}
                    {tooManyPlayers && (
                      <p className="text-sm text-center text-muted-foreground">
                        Too many players! Maximum 10 players allowed.
                      </p>
                    )}
                  </>
                ) : (
                  <div className="text-center py-4">
                    <p className="text-muted-foreground">
                      Waiting for host to start the game...
                    </p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </main>

      <footer className="border-t bg-card/50 backdrop-blur-sm py-4">
        <div className="container mx-auto px-4 text-center text-sm text-muted-foreground">
          © 2026. Built with love using{' '}
          <a
            href="https://caffeine.ai"
            target="_blank"
            rel="noopener noreferrer"
            className="text-primary hover:underline"
          >
            caffeine.ai
          </a>
        </div>
      </footer>
    </div>
  );
}

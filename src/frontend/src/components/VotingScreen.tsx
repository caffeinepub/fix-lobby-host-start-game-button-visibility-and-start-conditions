import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useVote } from '../hooks/useQueries';
import type { Room, Player } from '../backend';
import type { GameContext } from '../App';
import { Vote } from 'lucide-react';

interface VotingScreenProps {
  room: Room;
  gameContext: GameContext;
  currentPlayer: Player | undefined;
  onComplete: () => void;
}

export default function VotingScreen({
  room,
  gameContext,
  currentPlayer,
  onComplete,
}: VotingScreenProps) {
  const [selectedPlayerId, setSelectedPlayerId] = useState<number | null>(null);
  const [hasVoted, setHasVoted] = useState(false);
  const voteMutation = useVote();

  const activePlayers = room.players.filter((p) => !p.eliminated);
  const myVote = room.votes.find((v) => v[0] === gameContext.playerId);

  useEffect(() => {
    if (myVote) {
      setHasVoted(true);
      setSelectedPlayerId(myVote[1]);
    }
  }, [myVote]);

  // Check if all active players have voted
  useEffect(() => {
    const votedPlayerIds = new Set(room.votes.map((v) => v[0]));
    const allVoted = activePlayers.every((p) => votedPlayerIds.has(p.id));

    if (allVoted && activePlayers.length > 0) {
      setTimeout(() => onComplete(), 2000);
    }
  }, [room.votes, activePlayers, onComplete]);

  const handleVote = async () => {
    if (!selectedPlayerId || !currentPlayer) return;

    try {
      await voteMutation.mutateAsync({
        roomCode: gameContext.roomCode,
        voterId: currentPlayer.id,
        votedId: selectedPlayerId,
      });
      setHasVoted(true);
    } catch (error) {
      console.error('Failed to vote:', error);
    }
  };

  const getVoteCount = (playerId: number) => {
    return room.votes.filter((v) => v[1] === playerId).length;
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Voting Phase</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {room.votes.length} / {activePlayers.length} voted
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-2xl">
          <Card className="shadow-xl border-2">
            <CardHeader className="text-center">
              <CardTitle className="text-3xl flex items-center justify-center gap-2">
                <Vote className="w-8 h-8" />
                Who is the Spy?
              </CardTitle>
              <p className="text-muted-foreground mt-2">
                Vote for the player you think is the imposter
              </p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                {activePlayers.map((player) => {
                  const voteCount = getVoteCount(player.id);
                  const isSelected = selectedPlayerId === player.id;
                  const isMe = player.id === gameContext.playerId;

                  return (
                    <button
                      key={player.id}
                      className={`w-full p-4 rounded-lg border-2 transition-all ${
                        isSelected
                          ? 'border-primary bg-primary/10'
                          : 'border-border hover:border-primary/50'
                      } ${hasVoted ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                      onClick={() => !hasVoted && !isMe && setSelectedPlayerId(player.id)}
                      disabled={hasVoted || isMe}
                    >
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center font-semibold text-lg">
                            {player.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="text-left">
                            <div className="font-medium text-lg">
                              {player.name}
                              {isMe && <span className="text-muted-foreground ml-2">(You)</span>}
                            </div>
                          </div>
                        </div>
                        {voteCount > 0 && (
                          <Badge variant="secondary" className="text-lg px-3 py-1">
                            {voteCount} {voteCount === 1 ? 'vote' : 'votes'}
                          </Badge>
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>

              {!hasVoted && (
                <Button
                  size="lg"
                  className="w-full text-lg h-14"
                  onClick={handleVote}
                  disabled={!selectedPlayerId || voteMutation.isPending}
                >
                  {voteMutation.isPending ? 'Voting...' : 'Cast Vote'}
                </Button>
              )}

              {hasVoted && (
                <div className="text-center text-muted-foreground">
                  Waiting for other players to vote...
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

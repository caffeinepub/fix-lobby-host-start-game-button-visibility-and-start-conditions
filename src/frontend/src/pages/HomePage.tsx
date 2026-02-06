import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { useCreateRoom, useJoinRoom } from '../hooks/useQueries';
import { toast } from 'sonner';
import { Pencil, Users } from 'lucide-react';

interface HomePageProps {
  onNavigateToLobby: (roomCode: string, playerName: string, playerId: number | null) => void;
}

function generateRoomCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '';
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export default function HomePage({ onNavigateToLobby }: HomePageProps) {
  const [mode, setMode] = useState<'menu' | 'create' | 'join'>('menu');
  const [playerName, setPlayerName] = useState('');
  const [joinCode, setJoinCode] = useState('');

  const createRoomMutation = useCreateRoom();
  const joinRoomMutation = useJoinRoom();

  const handleCreateRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }

    const code = generateRoomCode();
    try {
      await createRoomMutation.mutateAsync({ playerName: playerName.trim(), code });
      toast.success('Room created!');
      // Don't pass playerId - let LobbyPage resolve it from room state
      onNavigateToLobby(code, playerName.trim(), null);
    } catch (error) {
      toast.error('Failed to create room. Name might be taken.');
    }
  };

  const handleJoinRoom = async () => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    if (!joinCode.trim() || joinCode.length !== 5) {
      toast.error('Please enter a valid 5-character room code');
      return;
    }

    try {
      const success = await joinRoomMutation.mutateAsync({
        roomCode: joinCode.toUpperCase(),
        playerName: playerName.trim(),
      });
      if (success) {
        toast.success('Joined room!');
        // Don't pass playerId - let LobbyPage resolve it from room state
        onNavigateToLobby(joinCode.toUpperCase(), playerName.trim(), null);
      } else {
        toast.error('Room not found or is full');
      }
    } catch (error) {
      toast.error('Failed to join room. Name might be taken.');
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-primary flex items-center justify-center">
              <Pencil className="w-6 h-6 text-primary-foreground" />
            </div>
            <h1 className="text-2xl font-bold">DrawSpy</h1>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-md">
          {mode === 'menu' && (
            <Card className="shadow-xl border-2">
              <CardHeader className="text-center space-y-2">
                <div className="mx-auto w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-2">
                  <Pencil className="w-10 h-10 text-primary" />
                </div>
                <CardTitle className="text-3xl">DrawSpy</CardTitle>
                <CardDescription className="text-base">
                  A multiplayer drawing game where one player is the spy!
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  size="lg"
                  className="w-full text-lg h-14"
                  onClick={() => setMode('create')}
                >
                  <Users className="w-5 h-5 mr-2" />
                  Create Room
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  className="w-full text-lg h-14"
                  onClick={() => setMode('join')}
                >
                  Join Room
                </Button>
              </CardContent>
            </Card>
          )}

          {mode === 'create' && (
            <Card className="shadow-xl border-2">
              <CardHeader>
                <CardTitle>Create Room</CardTitle>
                <CardDescription>Enter your name to create a new game room</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="create-name">Your Name</Label>
                  <Input
                    id="create-name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    onKeyDown={(e) => e.key === 'Enter' && handleCreateRoom()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMode('menu');
                      setPlayerName('');
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleCreateRoom}
                    disabled={createRoomMutation.isPending}
                  >
                    {createRoomMutation.isPending ? 'Creating...' : 'Create'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {mode === 'join' && (
            <Card className="shadow-xl border-2">
              <CardHeader>
                <CardTitle>Join Room</CardTitle>
                <CardDescription>Enter the room code and your name</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="join-code">Room Code</Label>
                  <Input
                    id="join-code"
                    placeholder="5-character code"
                    value={joinCode}
                    onChange={(e) => setJoinCode(e.target.value.toUpperCase())}
                    maxLength={5}
                    className="uppercase text-center text-xl font-mono tracking-widest"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="join-name">Your Name</Label>
                  <Input
                    id="join-name"
                    placeholder="Enter your name"
                    value={playerName}
                    onChange={(e) => setPlayerName(e.target.value)}
                    maxLength={20}
                    onKeyDown={(e) => e.key === 'Enter' && handleJoinRoom()}
                  />
                </div>
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    className="flex-1"
                    onClick={() => {
                      setMode('menu');
                      setPlayerName('');
                      setJoinCode('');
                    }}
                  >
                    Back
                  </Button>
                  <Button
                    className="flex-1"
                    onClick={handleJoinRoom}
                    disabled={joinRoomMutation.isPending}
                  >
                    {joinRoomMutation.isPending ? 'Joining...' : 'Join'}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
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

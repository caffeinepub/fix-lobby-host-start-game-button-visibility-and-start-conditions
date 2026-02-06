import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Room, Player } from '../backend';

interface RoleRevealScreenProps {
  room: Room;
  currentPlayer: Player | undefined;
  onComplete: () => void;
}

export default function RoleRevealScreen({
  room,
  currentPlayer,
  onComplete,
}: RoleRevealScreenProps) {
  const [countdown, setCountdown] = useState(5);
  const [hasCompleted, setHasCompleted] = useState(false);

  useEffect(() => {
    if (hasCompleted) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          setHasCompleted(true);
          // Small delay before calling onComplete to ensure smooth transition
          setTimeout(() => {
            onComplete();
          }, 100);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onComplete, hasCompleted]);

  const isSpy = currentPlayer?.isSpy || false;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-primary/5 via-background to-accent/5 p-4">
      <Card className="max-w-2xl w-full shadow-2xl border-2">
        <CardHeader className="text-center space-y-4">
          <div className="mx-auto">
            {isSpy ? (
              <img
                src="/assets/generated/spy-icon-transparent.dim_128x128.png"
                alt="Spy"
                className="w-32 h-32 mx-auto animate-pulse"
              />
            ) : (
              <img
                src="/assets/generated/drawing-palette.dim_200x150.png"
                alt="Drawing"
                className="w-40 h-30 mx-auto"
              />
            )}
          </div>
          <CardTitle className="text-4xl">
            {isSpy ? (
              <span className="text-destructive">You are the Spy</span>
            ) : (
              <span className="text-primary">Your Word</span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center space-y-6">
          {isSpy ? (
            <div className="space-y-4">
              <p className="text-xl text-muted-foreground">
                Try to blend in without knowing the word!
              </p>
              <p className="text-lg">
                Draw something that could fit any word, and don't get caught!
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="text-5xl font-bold bg-primary/10 py-8 px-6 rounded-lg border-2 border-primary">
                {room.currentWord}
              </div>
              <p className="text-lg text-muted-foreground">
                Draw this word, but watch out for the spy!
              </p>
            </div>
          )}

          <div className="pt-4">
            {countdown > 0 ? (
              <Badge variant="secondary" className="text-2xl px-6 py-3">
                Starting in {countdown}s
              </Badge>
            ) : (
              <Badge variant="default" className="text-2xl px-6 py-3 animate-pulse">
                Get Ready!
              </Badge>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

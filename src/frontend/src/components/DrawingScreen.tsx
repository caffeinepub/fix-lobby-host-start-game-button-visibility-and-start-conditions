import { useEffect, useState, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useSubmitDrawing } from '../hooks/useQueries';
import type { Room, Player, Stroke } from '../backend';
import type { GameContext } from '../App';
import { Pencil, Undo, Trash2, Vote as VoteIcon, AlertCircle } from 'lucide-react';

interface DrawingScreenProps {
  room: Room;
  gameContext: GameContext;
  currentPlayer: Player | undefined;
  onComplete: () => void;
}

const COLORS = ['#000000', '#FF0000', '#00FF00', '#0000FF', '#FFFF00', '#FF00FF', '#00FFFF'];
const WIDTHS = [2, 4, 8];

export default function DrawingScreen({
  room,
  gameContext,
  currentPlayer,
  onComplete,
}: DrawingScreenProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentStroke, setCurrentStroke] = useState<Array<[number, number]>>([]);
  const [selectedColor, setSelectedColor] = useState('#000000');
  const [selectedWidth, setSelectedWidth] = useState(4);
  const [timer, setTimer] = useState(15);
  const [currentTurnIndex, setCurrentTurnIndex] = useState(0);
  const [hasDrawn, setHasDrawn] = useState<Set<number>>(new Set());
  const [submissionError, setSubmissionError] = useState<string | null>(null);
  const [localStrokes, setLocalStrokes] = useState<Stroke[]>([]);

  const submitDrawingMutation = useSubmitDrawing();

  const activePlayers = room.players.filter((p) => !p.eliminated);
  const currentTurnPlayer = activePlayers[currentTurnIndex];
  const isMyTurn = currentTurnPlayer?.id === gameContext.playerId;

  // Redraw all strokes
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw both backend strokes and local strokes
    const allStrokes = [...room.drawings, ...localStrokes];
    allStrokes.forEach((stroke) => {
      if (stroke.points.length < 2) return;

      ctx.strokeStyle = stroke.color;
      ctx.lineWidth = Number(stroke.width);
      ctx.lineCap = 'round';
      ctx.lineJoin = 'round';

      ctx.beginPath();
      ctx.moveTo(stroke.points[0][0], stroke.points[0][1]);
      for (let i = 1; i < stroke.points.length; i++) {
        ctx.lineTo(stroke.points[i][0], stroke.points[i][1]);
      }
      ctx.stroke();
    });
  }, [room.drawings, localStrokes]);

  // Timer countdown
  useEffect(() => {
    if (!isMyTurn) return;

    const interval = setInterval(() => {
      setTimer((prev) => {
        if (prev <= 1) {
          handleTurnEnd();
          return 15;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isMyTurn, currentTurnIndex]);

  const handleTurnEnd = () => {
    if (currentStroke.length > 0) {
      submitStroke();
    }

    const newHasDrawn = new Set(hasDrawn);
    newHasDrawn.add(currentTurnPlayer.id);
    setHasDrawn(newHasDrawn);

    if (currentTurnIndex + 1 >= activePlayers.length) {
      // All players have drawn
      setTimeout(() => onComplete(), 1000);
    } else {
      setCurrentTurnIndex((prev) => prev + 1);
      setTimer(15);
    }
  };

  const submitStroke = async () => {
    if (currentStroke.length < 2) return;

    const stroke: Stroke = {
      points: currentStroke,
      color: selectedColor,
      width: BigInt(selectedWidth),
    };

    // Add to local strokes immediately for instant feedback
    setLocalStrokes((prev) => [...prev, stroke]);

    try {
      setSubmissionError(null);
      await submitDrawingMutation.mutateAsync({
        roomCode: gameContext.roomCode,
        drawing: stroke,
      });
      setCurrentStroke([]);
    } catch (error) {
      console.error('Failed to submit drawing:', error);
      setSubmissionError('Failed to submit drawing. Your stroke may not be saved.');
    }
  };

  const handleUndo = () => {
    if (localStrokes.length > 0) {
      setLocalStrokes((prev) => prev.slice(0, -1));
    }
  };

  const handleClear = () => {
    setLocalStrokes([]);
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
      }
    }
  };

  const handleVoteEarly = () => {
    onComplete();
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMyTurn) return;

    const { x, y } = getCanvasCoordinates(e);
    setIsDrawing(true);
    setCurrentStroke([[x, y]]);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !isMyTurn) return;

    const { x, y } = getCanvasCoordinates(e);
    const newStroke = [...currentStroke, [x, y] as [number, number]];
    setCurrentStroke(newStroke);

    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!ctx || currentStroke.length === 0) return;

    ctx.strokeStyle = selectedColor;
    ctx.lineWidth = selectedWidth;
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';

    ctx.beginPath();
    const lastPoint = currentStroke[currentStroke.length - 1];
    ctx.moveTo(lastPoint[0], lastPoint[1]);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDrawing = () => {
    if (isDrawing && currentStroke.length > 1) {
      submitStroke();
    }
    setIsDrawing(false);
  };

  return (
    <div className="min-h-screen flex flex-col bg-gradient-to-br from-primary/5 via-background to-accent/5">
      <header className="border-b bg-card/50 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold">Drawing Phase</h1>
            <Badge variant="secondary" className="text-lg px-4 py-2">
              {currentTurnIndex + 1} / {activePlayers.length}
            </Badge>
          </div>
        </div>
      </header>

      <main className="flex-1 flex items-center justify-center p-4">
        <div className="w-full max-w-4xl space-y-4">
          {submissionError && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{submissionError}</AlertDescription>
            </Alert>
          )}

          <Card className="shadow-xl border-2">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2">
                  <Pencil className="w-5 h-5" />
                  {isMyTurn ? "Your Turn!" : `${currentTurnPlayer?.name}'s Turn`}
                </CardTitle>
                <Badge variant={isMyTurn ? 'default' : 'secondary'} className="text-xl px-4 py-2">
                  {timer}s
                </Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="relative bg-white rounded-lg overflow-hidden border-4 border-border">
                <canvas
                  ref={canvasRef}
                  width={800}
                  height={600}
                  className="w-full cursor-crosshair"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                />
                {!isMyTurn && (
                  <div className="absolute inset-0 bg-background/20 backdrop-blur-[1px] flex items-center justify-center pointer-events-none">
                    <Badge variant="secondary" className="text-lg px-6 py-3">
                      Waiting for {currentTurnPlayer?.name}...
                    </Badge>
                  </div>
                )}
              </div>

              {isMyTurn && (
                <div className="space-y-3">
                  <div className="flex items-center justify-between gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Color:</span>
                      <div className="flex gap-2">
                        {COLORS.map((color) => (
                          <button
                            key={color}
                            className={`w-8 h-8 rounded-full border-2 transition-transform ${
                              selectedColor === color
                                ? 'border-primary scale-110'
                                : 'border-border'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => setSelectedColor(color)}
                          />
                        ))}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">Size:</span>
                      <div className="flex gap-2">
                        {WIDTHS.map((width) => (
                          <button
                            key={width}
                            className={`w-10 h-10 rounded-lg border-2 flex items-center justify-center transition-all ${
                              selectedWidth === width
                                ? 'border-primary bg-primary/10'
                                : 'border-border'
                            }`}
                            onClick={() => setSelectedWidth(width)}
                          >
                            <div
                              className="rounded-full bg-foreground"
                              style={{ width: width * 2, height: width * 2 }}
                            />
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleUndo}
                      disabled={localStrokes.length === 0}
                    >
                      <Undo className="w-4 h-4 mr-2" />
                      Undo
                    </Button>
                    <Button
                      variant="outline"
                      className="flex-1"
                      onClick={handleClear}
                      disabled={localStrokes.length === 0}
                    >
                      <Trash2 className="w-4 h-4 mr-2" />
                      Clear
                    </Button>
                    <Button
                      variant="default"
                      className="flex-1"
                      onClick={handleVoteEarly}
                    >
                      <VoteIcon className="w-4 h-4 mr-2" />
                      Vote
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}

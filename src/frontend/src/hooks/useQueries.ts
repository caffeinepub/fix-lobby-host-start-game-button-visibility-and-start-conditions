import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useActor } from './useActor';
import type { Room, Stroke, PlayerId } from '../backend';

export function useCreateRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ playerName, code }: { playerName: string; code: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.createRoom(playerName, code);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useJoinRoom() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomCode, playerName }: { roomCode: string; playerName: string }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.joinRoom(roomCode, playerName);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useRoomState(roomCode: string, enabled: boolean = true) {
  const { actor, isFetching } = useActor();

  return useQuery<Room>({
    queryKey: ['room', roomCode],
    queryFn: async () => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.getRoomState(roomCode);
    },
    enabled: !!actor && !isFetching && enabled && roomCode.length > 0,
    refetchInterval: 1000, // Poll every second for real-time updates
    retry: 3,
    retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
  });
}

export function useStartGame() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomCode,
      hostPlayerId,
    }: {
      roomCode: string;
      hostPlayerId: PlayerId;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      return actor.startGame(roomCode, hostPlayerId);
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['room', variables.roomCode] });
    },
  });
}

export function useSubmitDrawing() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ roomCode, drawing }: { roomCode: string; drawing: Stroke }) => {
      if (!actor) throw new Error('Actor not initialized');
      // Check if method exists before calling
      if (typeof (actor as any).submitDrawing !== 'function') {
        throw new Error('submitDrawing method not available on backend');
      }
      return (actor as any).submitDrawing(roomCode, drawing);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

export function useVote() {
  const { actor } = useActor();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      roomCode,
      voterId,
      votedId,
    }: {
      roomCode: string;
      voterId: PlayerId;
      votedId: PlayerId;
    }) => {
      if (!actor) throw new Error('Actor not initialized');
      // Check if method exists before calling
      if (typeof (actor as any).vote !== 'function') {
        throw new Error('vote method not available on backend');
      }
      return (actor as any).vote(roomCode, voterId, votedId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['room'] });
    },
  });
}

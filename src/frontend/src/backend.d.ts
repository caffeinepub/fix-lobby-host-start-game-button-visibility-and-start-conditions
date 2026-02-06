import type { Principal } from "@icp-sdk/core/principal";
export interface Some<T> {
    __kind__: "Some";
    value: T;
}
export interface None {
    __kind__: "None";
}
export type Option<T> = Some<T> | None;
export type PlayerId = number;
export interface Player {
    id: PlayerId;
    name: string;
    isHost: boolean;
    eliminated: boolean;
    isSpy: boolean;
}
export interface Stroke {
    color: string;
    width: bigint;
    points: Array<[number, number]>;
}
export type RoomCode = string;
export interface Room {
    turnOrder: Uint32Array;
    started: boolean;
    votes: Array<[PlayerId, PlayerId]>;
    code: RoomCode;
    host: PlayerId;
    drawings: Array<Stroke>;
    state: GameState;
    currentWord: Word;
    players: Array<Player>;
}
export type Word = string;
export enum GameState {
    winner = "winner",
    voting = "voting",
    results = "results",
    lobby = "lobby",
    roleReveal = "roleReveal",
    drawing = "drawing"
}
export interface backendInterface {
    createRoom(playerName: string, code: string): Promise<string>;
    getRoomState(roomCode: string): Promise<Room>;
    joinRoom(roomCode: string, playerName: string): Promise<boolean>;
    startGame(roomCode: string, hostPlayerId: PlayerId): Promise<void>;
}

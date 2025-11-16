export enum RoomState {
  READY = "READY",
  PLAYING = "PLAYING",
  ENDED = "ENDED",
}

export enum RoundState {
  NOT_STARTED = "NOT_STARTED",
  IN_PROGRESS = "IN_PROGRESS",
  COMPLETED = "COMPLETED",
}
export interface IPlayerInfo {
  id: string;
  name: string;
  avatar: string;
  roundState: RoundState;
  isHost: boolean;
}

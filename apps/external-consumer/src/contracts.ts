/** Contratos HTTP públicos. No provienen de entidades internas del backend. */

export type ApiUser = {
  id: string;
  email: string;
  displayName: string;
  role: string;
};

export type LoginResponse = {
  accessToken: string;
  user: ApiUser;
};

export type RankedParticipant = {
  userId: string;
  displayName: string;
  score: number;
  rank: number;
};

export type PodiumPlace = {
  userId: string;
  displayName: string;
  score: number;
  position: number;
};

export type SessionSummary = {
  roomCode: string;
  finishedAt: string;
  participants: RankedParticipant[];
};

export type SessionDetail = SessionSummary & {
  podium: PodiumPlace[];
};

export class ApiError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "ApiError";
    this.status = status;
  }
}

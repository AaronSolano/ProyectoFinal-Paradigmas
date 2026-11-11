import type { GameFinishResultsPayload, LeaderboardEntry, PodiumEntry } from "@profelink/shared-dtos";

export type SessionSummary = {
  roomCode: string;
  finishedAt: string;
  participants: LeaderboardEntry[];
};

export type SessionDetail = SessionSummary & {
  podium: PodiumEntry[];
};

export type HistoryPresentation =
  | { status: "loading" }
  | { status: "empty" }
  | { status: "error"; message: string }
  | { status: "ready"; sessions: SessionSummary[] };

export type DetailPresentation =
  | { status: "loading" }
  | { status: "error"; message: string }
  | { status: "ready"; detail: SessionDetail };

export const MISSING_SESSION = "Sesión no encontrada.";

export function presentHistory(
  loading: boolean,
  error: string | null,
  sessions: SessionSummary[] | null,
): HistoryPresentation {
  if (loading) {
    return { status: "loading" };
  }
  if (error) {
    return { status: "error", message: error };
  }
  if (!sessions || sessions.length === 0) {
    return { status: "empty" };
  }
  return { status: "ready", sessions };
}

export function presentDetail(
  loading: boolean,
  error: string | null,
  detail: SessionDetail | null,
): DetailPresentation {
  if (loading) {
    return { status: "loading" };
  }
  if (error || !detail) {
    return { status: "error", message: error ?? MISSING_SESSION };
  }
  return { status: "ready", detail };
}

export function ownStanding(participants: readonly LeaderboardEntry[], userId: string): LeaderboardEntry | null {
  return participants.find((entry) => entry.userId === userId) ?? null;
}

export function finishFromDetail(detail: SessionDetail): GameFinishResultsPayload {
  return {
    roomCode: detail.roomCode,
    podium: detail.podium.map((entry) => ({ ...entry })),
    finalLeaderboard: detail.participants.map((entry) => ({ ...entry })),
  };
}

export function formatFinishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

export function shouldRecoverFinishedMatch(enteredRoom: boolean, alreadyFinished: boolean): boolean {
  return enteredRoom && !alreadyFinished;
}

export function liveRoomMissing(message: string): boolean {
  return message === "Sala no encontrada.";
}

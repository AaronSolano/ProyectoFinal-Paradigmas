import type { GameFinishResultsPayload } from "@profelink/shared-dtos";
import { gameRequest } from "../../shared/game-api";
import { HttpError } from "../../shared/http";
import { finishFromDetail, type SessionDetail, type SessionSummary } from "./session-history";

export function fetchFinishedSessions(token: string): Promise<SessionSummary[]> {
  return gameRequest<SessionSummary[]>("/api/sessions", token);
}

export function fetchFinishedSession(token: string, roomCode: string): Promise<SessionDetail> {
  return gameRequest<SessionDetail>(`/api/sessions/${encodeURIComponent(roomCode)}`, token);
}

export async function recoverFinishedMatch(
  token: string,
  roomCode: string,
): Promise<GameFinishResultsPayload | "missing"> {
  try {
    return finishFromDetail(await fetchFinishedSession(token, roomCode));
  } catch (error) {
    if (error instanceof HttpError && (error.status === 401 || error.status === 403 || error.status === 404)) {
      return "missing";
    }
    throw error;
  }
}

import { gameRequest } from "../../shared/game-api";

export function createLiveSession(token: string, quizId: string): Promise<{ roomCode: string }> {
  return gameRequest<{ roomCode: string }>(`/api/quizzes/${quizId}/sessions`, token, { method: "POST" });
}

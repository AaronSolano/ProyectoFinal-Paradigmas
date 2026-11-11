import { HttpError } from "../../shared/http";
import { gameRequest } from "../../shared/game-api";
import { fetchFinishedSession, fetchFinishedSessions, recoverFinishedMatch } from "./session-api";

vi.mock("../../shared/game-api", () => ({
  gameRequest: vi.fn(),
}));

const request = vi.mocked(gameRequest);

const detail = {
  roomCode: "PL-AB12",
  finishedAt: "2026-11-10T18:00:00.000Z",
  participants: [{ userId: "ana", displayName: "Ana", score: 1, rank: 1 }],
  podium: [{ userId: "ana", displayName: "Ana", score: 1, position: 1 }],
};

describe("consulta autenticada del historial", () => {
  beforeEach(() => {
    request.mockReset();
  });

  it("pide el listado y el detalle con el token, sin filtrar en el cliente", async () => {
    request.mockResolvedValueOnce([detail]).mockResolvedValueOnce(detail);

    await expect(fetchFinishedSessions("token-profesor")).resolves.toEqual([detail]);
    await expect(fetchFinishedSession("token-estudiante", "PL AB")).resolves.toEqual(detail);

    expect(request).toHaveBeenNthCalledWith(1, "/api/sessions", "token-profesor");
    expect(request).toHaveBeenNthCalledWith(2, "/api/sessions/PL%20AB", "token-estudiante");
  });

  it("recupera la clasificación guardada y no inventa una sala ausente", async () => {
    request.mockResolvedValueOnce(detail);
    await expect(recoverFinishedMatch("token-estudiante", "PL-AB12")).resolves.toEqual({
      roomCode: "PL-AB12",
      podium: detail.podium,
      finalLeaderboard: detail.participants,
    });

    request.mockRejectedValueOnce(new HttpError(404, "Sesión no encontrada."));
    await expect(recoverFinishedMatch("token-estudiante", "PL-NONE")).resolves.toBe("missing");

    request.mockRejectedValueOnce(new HttpError(401, "No autorizado."));
    await expect(recoverFinishedMatch("token-ajeno", "PL-AB12")).resolves.toBe("missing");
  });
});

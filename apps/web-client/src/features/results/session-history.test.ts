import type { SessionDetail } from "./session-history";
import {
  finishFromDetail,
  formatFinishedAt,
  liveRoomMissing,
  ownStanding,
  presentDetail,
  presentHistory,
  shouldRecoverFinishedMatch,
} from "./session-history";

const zoe = { userId: "zoe", displayName: "Zoe", score: 2, rank: 1 };
const ana = { userId: "ana", displayName: "Ana", score: 2, rank: 2 };
const detail: SessionDetail = {
  roomCode: "PL-AB12",
  finishedAt: "2026-11-10T18:00:00.000Z",
  participants: [zoe, ana],
  podium: [
    { userId: "zoe", displayName: "Zoe", score: 2, position: 1 },
    { userId: "ana", displayName: "Ana", score: 2, position: 2 },
  ],
};

describe("historial de resultados", () => {
  it("distingue carga, vacío, error y listado", () => {
    expect(presentHistory(true, null, null).status).toBe("loading");
    expect(presentHistory(false, "No se pudo cargar el historial.", null).status).toBe("error");
    expect(presentHistory(false, null, []).status).toBe("empty");
    expect(presentHistory(false, null, [detail]).status).toBe("ready");
  });

  it("oculta la clasificación cuando la sala no existe o no está autorizada", () => {
    const hidden = presentDetail(false, "Sesión no encontrada.", null);

    expect(hidden.status).toBe("error");
    expect(hidden).not.toHaveProperty("detail");
  });

  it("conserva el orden, el empate y deja fuera al anfitrión", () => {
    const payload = finishFromDetail(detail);

    expect(payload.finalLeaderboard.map((entry) => entry.userId)).toEqual(["zoe", "ana"]);
    expect(payload.finalLeaderboard.map((entry) => entry.score)).toEqual([2, 2]);
    expect(payload.podium.map((entry) => entry.position)).toEqual([1, 2]);
    expect(payload.finalLeaderboard.map((entry) => entry.userId)).not.toContain("teacher-1");
    expect(ownStanding(detail.participants, "ana")?.rank).toBe(2);
    expect(ownStanding(detail.participants, "teacher-1")).toBeNull();
  });

  it("recupera el resultado solo si la persona ya entró y todavía no lo recibió", () => {
    expect(shouldRecoverFinishedMatch(true, false)).toBe(true);
    expect(shouldRecoverFinishedMatch(false, false)).toBe(false);
    expect(shouldRecoverFinishedMatch(true, true)).toBe(false);
    expect(liveRoomMissing("Sala no encontrada.")).toBe(true);
    expect(liveRoomMissing("Hay una pregunta abierta.")).toBe(false);
    expect(formatFinishedAt(detail.finishedAt)).toContain("2026");
  });
});

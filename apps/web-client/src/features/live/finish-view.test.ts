import type { GameFinishResultsPayload, LeaderboardEntry, PodiumEntry } from "@profelink/shared-dtos";
import { blocksLiveUpdates, finishView, podiumSlots, retainFinishedResult } from "./finish-view";

const ana: LeaderboardEntry = { userId: "ana", displayName: "Ana", score: 3, rank: 1 };
const bea: LeaderboardEntry = { userId: "bea", displayName: "Bea", score: 2, rank: 2 };
const carlos: LeaderboardEntry = { userId: "carlos", displayName: "Carlos", score: 1, rank: 3 };
const dario: LeaderboardEntry = { userId: "dario", displayName: "Darío", score: 0, rank: 4 };

function place(entry: LeaderboardEntry, position: 1 | 2 | 3): PodiumEntry {
  return {
    userId: entry.userId,
    displayName: entry.displayName,
    score: entry.score,
    position,
  };
}

function payload(
  ranking: LeaderboardEntry[],
  podium: PodiumEntry[],
): GameFinishResultsPayload {
  return { roomCode: "PL-TEST", podium, finalLeaderboard: ranking };
}

describe("podio visual", () => {
  it("ordena tres puestos con el primero al centro y conserva el puntaje", () => {
    const view = finishView(payload([ana, bea, carlos], [place(ana, 1), place(bea, 2), place(carlos, 3)]));

    expect(view.podium.map((entry) => entry.position)).toEqual([2, 1, 3]);
    expect(view.podium.map((entry) => entry.score)).toEqual([2, 3, 1]);
    expect(view.ranking).toEqual([ana, bea, carlos]);
  });

  it("muestra solo los puestos que envía el servidor", () => {
    expect(podiumSlots([place(ana, 1)]).map((entry) => entry.position)).toEqual([1]);
    expect(podiumSlots([place(ana, 1), place(bea, 2)]).map((entry) => entry.position)).toEqual([2, 1]);
  });

  it("conserva la clasificación completa, los empates y deja fuera al anfitrión", () => {
    const tiedFirst: LeaderboardEntry = { userId: "zoe", displayName: "Zoe", score: 2, rank: 1 };
    const tiedSecond: LeaderboardEntry = { userId: "ana", displayName: "Ana", score: 2, rank: 2 };
    const view = finishView(
      payload([tiedFirst, tiedSecond, dario], [place(tiedFirst, 1), place(tiedSecond, 2)]),
    );

    expect(view.ranking.map((entry) => entry.userId)).toEqual(["zoe", "ana", "dario"]);
    expect(view.ranking.map((entry) => entry.score)).toEqual([2, 2, 0]);
    expect(view.ranking.map((entry) => entry.rank)).toEqual([1, 2, 4]);
    expect(view.ranking.map((entry) => entry.userId)).not.toContain("host-1");
    expect(view.podium.map((entry) => entry.userId)).not.toContain("host-1");
  });

  it("no inventa participantes cuando la sala terminó vacía", () => {
    const view = finishView(payload([], []));

    expect(view.empty).toBe(true);
    expect(view.podium).toEqual([]);
    expect(view.ranking).toEqual([]);
  });

  it("conserva el resultado recibido aunque la conexión cambie", () => {
    const received = payload([ana], [place(ana, 1)]);

    expect(retainFinishedResult(received)).toBe(received);
    expect(blocksLiveUpdates(true)).toBe(true);
    expect(blocksLiveUpdates(false)).toBe(false);
  });
});

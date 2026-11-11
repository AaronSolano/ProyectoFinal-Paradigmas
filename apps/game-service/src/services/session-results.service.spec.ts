import { NotFoundException } from "@nestjs/common";
import { GameSessionRepository } from "../persistence/game-session.repository";
import { SessionResultsService, StoredFinishedSession } from "./session-results.service";

describe("SessionResultsService", () => {
  const sessions = {
    listFinishedForUser: jest.fn(),
    findFinishedForUser: jest.fn(),
  };
  const service = new SessionResultsService(sessions as unknown as GameSessionRepository);

  const stored: StoredFinishedSession = {
    roomCode: "PL-AB12",
    hostId: "teacher-1",
    finishedAt: new Date("2026-11-10T18:00:00.000Z"),
    participants: [
      { userId: "p2", displayName: "Zoe", finalScore: 1 },
      { userId: "p1", displayName: "Ana", finalScore: 2 },
      { userId: "p3", displayName: "Bea", finalScore: 1 },
    ],
  };

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("returns an empty list when the caller has no finished sessions", async () => {
    sessions.listFinishedForUser.mockResolvedValue([]);

    await expect(service.listForUser("user-1")).resolves.toEqual([]);
    expect(sessions.listFinishedForUser).toHaveBeenCalledWith("user-1");
  });

  it("returns ranked participants for an authorized finished session", async () => {
    sessions.listFinishedForUser.mockResolvedValue([stored]);
    sessions.findFinishedForUser.mockResolvedValue(stored);

    const listed = await service.listForUser("user-1");
    expect(listed).toEqual([
      {
        roomCode: "PL-AB12",
        finishedAt: "2026-11-10T18:00:00.000Z",
        participants: [
          { userId: "p1", displayName: "Ana", score: 2, rank: 1 },
          { userId: "p3", displayName: "Bea", score: 1, rank: 2 },
          { userId: "p2", displayName: "Zoe", score: 1, rank: 3 },
        ],
      },
    ]);

    const detail = await service.getForUser("user-1", "PL-AB12");
    expect(detail.podium).toEqual([
      { userId: "p1", displayName: "Ana", score: 2, position: 1 },
      { userId: "p3", displayName: "Bea", score: 1, position: 2 },
      { userId: "p2", displayName: "Zoe", score: 1, position: 3 },
    ]);
    expect(sessions.findFinishedForUser).toHaveBeenCalledWith("PL-AB12", "user-1");
  });

  it("excludes the host from the historical ranking and podium", async () => {
    const withHost: StoredFinishedSession = {
      ...stored,
      participants: [
        ...stored.participants,
        { userId: "teacher-1", displayName: "Profesor", finalScore: 9 },
      ],
    };
    sessions.findFinishedForUser.mockResolvedValue(withHost);

    const detail = await service.getForUser("teacher-1", "PL-AB12");

    expect(detail.participants.map((entry) => entry.userId)).toEqual(["p1", "p3", "p2"]);
    expect(detail.podium.map((entry) => entry.userId)).toEqual(["p1", "p3", "p2"]);
  });

  it("uses the same 404 for a missing, unfinished, or foreign session", async () => {
    sessions.findFinishedForUser.mockResolvedValue(null);

    const missing = service.getForUser("user-1", "PL-NONE");
    const hidden = service.getForUser("outsider", "PL-AB12");

    await expect(missing).rejects.toBeInstanceOf(NotFoundException);
    await expect(hidden).rejects.toBeInstanceOf(NotFoundException);
    await expect(missing).rejects.toThrow("Sesión no encontrada.");
    await expect(hidden).rejects.toThrow("Sesión no encontrada.");
  });
});

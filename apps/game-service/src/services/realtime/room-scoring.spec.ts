import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { SessionStatus, WsEventNames } from "@profelink/shared-dtos";
import { AuthUser } from "../../entities/auth-user";
import { GameSessionRepository } from "../../persistence/game-session.repository";
import { QuizRepository } from "../../persistence/quiz.repository";
import { QuestionSnapshot } from "../../entities/live-room.types";
import { GameEngineService } from "./game-engine.service";
import { InMemoryRoomStore } from "./in-memory-room.store";
import { RoomManagerService } from "./room-manager.service";

const questions: QuestionSnapshot[] = [
  {
    id: "q1",
    statement: "Uno",
    imageUrl: null,
    correctAnswer: true,
    timeLimitSeconds: 20,
    sortOrder: 0,
  },
  {
    id: "q2",
    statement: "Dos",
    imageUrl: null,
    correctAnswer: false,
    timeLimitSeconds: 20,
    sortOrder: 1,
  },
];

describe("Room scoring integrity", () => {
  const store = new InMemoryRoomStore();
  const sessions = { persistFinishedSession: jest.fn() };
  const manager = new RoomManagerService(
    store,
    new GameEngineService(),
    {} as QuizRepository,
    sessions as unknown as GameSessionRepository,
  );
  const host: AuthUser = {
    userId: "host-1",
    email: "profe@profelink.cr",
    role: "HOST",
  };
  const student: AuthUser = {
    userId: "student-1",
    email: "alumno@profelink.cr",
    role: "PARTICIPANT",
  };
  const other: AuthUser = {
    userId: "student-2",
    email: "otro@profelink.cr",
    role: "PARTICIPANT",
  };
  const emit = { toRoom: jest.fn(), toClient: jest.fn() };

  afterEach(() => {
    store.onModuleDestroy();
  });

  beforeEach(() => {
    sessions.persistFinishedSession.mockReset();
    sessions.persistFinishedSession.mockResolvedValue(undefined);
    emit.toRoom.mockReset();
    emit.toClient.mockReset();
  });

  function silence(roomCode: string): void {
    const room = store.getRoom(roomCode);
    if (room?.closeTimer) {
      clearTimeout(room.closeTimer);
      room.closeTimer = null;
    }
  }

  it("does not award points again when a question index is reopened", () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    manager.joinRoom(student, room.roomCode, "Alumno", "sock-student", emit);
    manager.startQuestion(host, room.roomCode, 0, emit, () => undefined);
    manager.submitAnswer(student, room.roomCode, true, emit, "sock-student");
    expect(room.participants.get(student.userId)?.score).toBe(1);

    expect(() =>
      manager.startQuestion(host, room.roomCode, 0, emit, () => undefined),
    ).toThrow(BadRequestException);
    manager.submitAnswer(student, room.roomCode, true, emit, "sock-student");
    expect(room.participants.get(student.userId)?.score).toBe(1);

    manager.closeQuestion(host, room.roomCode, 0, emit);
    expect(() =>
      manager.startQuestion(host, room.roomCode, 0, emit, () => undefined),
    ).toThrow(BadRequestException);
    expect(room.participants.get(student.userId)?.score).toBe(1);

    manager.startQuestion(host, room.roomCode, 1, emit, () => undefined);
    manager.submitAnswer(student, room.roomCode, false, emit, "sock-student");
    expect(room.participants.get(student.userId)?.score).toBe(2);
    expect(() =>
      manager.startQuestion(host, room.roomCode, 1, emit, () => undefined),
    ).toThrow(BadRequestException);
    expect(room.participants.get(student.userId)?.score).toBe(2);
    silence(room.roomCode);
  });

  it("keeps the host in the participant list and out of the ranking", async () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    manager.joinRoom(host, room.roomCode, "Profesor", "sock-host", emit);
    manager.joinRoom(student, room.roomCode, "Ana", "sock-ana", emit);
    manager.joinRoom(other, room.roomCode, "Bea", "sock-bea", emit);
    expect(room.participants.get(host.userId)?.role).toBe("HOST");
    expect(room.participants.get(student.userId)?.role).toBe("PARTICIPANT");
    const joined = emit.toRoom.mock.calls.find(
      (call) =>
        call[1] === WsEventNames.ROOM_PARTICIPANT_JOINED &&
        call[2].participants.some(
          (participant: { userId: string }) => participant.userId === student.userId,
        ),
    );
    expect(joined?.[2].participants).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ userId: host.userId, role: "HOST" }),
        expect.objectContaining({ userId: student.userId, role: "PARTICIPANT" }),
      ]),
    );

    manager.startQuestion(host, room.roomCode, 0, emit, () => undefined);
    manager.submitAnswer(student, room.roomCode, true, emit, "sock-ana");
    const hostParticipant = room.participants.get(host.userId);
    if (hostParticipant) {
      hostParticipant.score = 9;
    }

    const closed = manager.closeQuestion(host, room.roomCode, 0, emit);
    expect(closed.leaderboard.map((entry) => entry.userId)).toEqual([student.userId, other.userId]);
    manager.startQuestion(host, room.roomCode, 1, emit, () => undefined);
    manager.closeQuestion(host, room.roomCode, 1, emit);

    const finished = await manager.finishGame(host, room.roomCode, emit);
    expect(finished.finalLeaderboard.map((entry) => entry.userId)).toEqual([
      student.userId,
      other.userId,
    ]);
    expect(finished.podium.map((entry) => entry.userId)).toEqual([student.userId, other.userId]);
    expect(sessions.persistFinishedSession).toHaveBeenCalledTimes(1);
    const persisted = sessions.persistFinishedSession.mock.calls[0][0];
    expect(persisted.participants.has(host.userId)).toBe(true);
    expect(persisted.participants.get(student.userId)?.score).toBe(1);
    silence(room.roomCode);
  });

  function closeEveryQuestion(roomCode: string): void {
    const room = store.getRoom(roomCode);
    room?.questions.forEach((_, index) => {
      if (!room.openedQuestionIndexes.has(index)) {
        manager.startQuestion(host, roomCode, index, emit, () => undefined);
      }
      if (room.status === SessionStatus.QUESTION_ACTIVE && room.currentQuestionIndex === index) {
        manager.closeQuestion(host, roomCode, index, emit);
      }
    });
    silence(roomCode);
  }

  it("rejects a participant and a finish before every question is closed", async () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    manager.joinRoom(student, room.roomCode, "Ana", "sock-ana", emit);

    await expect(manager.finishGame(student, room.roomCode, emit)).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    await expect(manager.finishGame(host, room.roomCode, emit)).rejects.toThrow(
      "Aún hay preguntas pendientes.",
    );

    manager.startQuestion(host, room.roomCode, 0, emit, () => undefined);
    await expect(manager.finishGame(host, room.roomCode, emit)).rejects.toThrow(
      "Hay una pregunta abierta.",
    );
    expect(sessions.persistFinishedSession).not.toHaveBeenCalled();
    expect(room.participants.get(student.userId)?.score).toBe(0);
    silence(room.roomCode);
  });

  it("finishes once, keeps the score, and rejects a second request", async () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    manager.joinRoom(student, room.roomCode, "Ana", "sock-ana", emit);
    manager.startQuestion(host, room.roomCode, 0, emit, () => undefined);
    manager.submitAnswer(student, room.roomCode, true, emit, "sock-ana");
    manager.closeQuestion(host, room.roomCode, 0, emit);
    closeEveryQuestion(room.roomCode);

    const finished = await manager.finishGame(host, room.roomCode, emit);
    expect(finished.finalLeaderboard).toEqual([
      expect.objectContaining({ userId: student.userId, score: 1, rank: 1 }),
    ]);
    expect(finished.podium.map((entry) => entry.userId)).not.toContain(host.userId);
    expect(store.getRoom(room.roomCode)).toBeUndefined();

    await expect(manager.finishGame(host, room.roomCode, emit)).rejects.toThrow("Sala no encontrada.");
    expect(sessions.persistFinishedSession).toHaveBeenCalledTimes(1);
  });

  it("does not announce or delete the room when saving fails", async () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    closeEveryQuestion(room.roomCode);
    sessions.persistFinishedSession.mockRejectedValueOnce(new Error("db"));

    await expect(manager.finishGame(host, room.roomCode, emit)).rejects.toThrow(
      "No se pudo guardar el resultado. La partida sigue abierta.",
    );

    expect(store.getRoom(room.roomCode)?.status).toBe("QUESTION_CLOSED");
    expect(emit.toRoom.mock.calls.some((call) => call[1] === WsEventNames.GAME_FINISH)).toBe(false);
    silence(room.roomCode);
  });

  it("rejects a second finish while the first save is still running", async () => {
    const room = store.createRoom(host.userId, "quiz-1", questions);
    closeEveryQuestion(room.roomCode);
    let release: (() => void) | undefined;
    sessions.persistFinishedSession.mockImplementationOnce(
      () =>
        new Promise<void>((resolve) => {
          release = resolve;
        }),
    );

    const first = manager.finishGame(host, room.roomCode, emit);
    await expect(manager.finishGame(host, room.roomCode, emit)).rejects.toThrow(
      "La partida ya finalizó.",
    );
    release?.();
    await first;
    expect(sessions.persistFinishedSession).toHaveBeenCalledTimes(1);
  });
});

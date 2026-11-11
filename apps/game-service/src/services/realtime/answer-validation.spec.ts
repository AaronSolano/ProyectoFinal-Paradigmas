import { SessionStatus } from "@profelink/shared-dtos";
import { LiveRoom } from "../../entities/live-room.types";
import { GameEngineService } from "./game-engine.service";

function buildRoom(): LiveRoom {
  return {
    roomCode: "PL-TEST",
    quizId: "quiz-1",
    hostId: "host-1",
    status: SessionStatus.QUESTION_ACTIVE,
    participants: new Map([
      [
        "student-1",
        {
          userId: "student-1",
          displayName: "Alumno",
          role: "PARTICIPANT",
          score: 0,
        },
      ],
    ]),
    questions: [
      {
        id: "q1",
        statement: "2+2=4",
        imageUrl: null,
        correctAnswer: true,
        timeLimitSeconds: 30,
        sortOrder: 0,
      },
    ],
    currentQuestionIndex: 0,
    questionExpiresAt: Date.now() + 30_000,
    answeredUserIds: new Set(),
    openedQuestionIndexes: new Set(),
    answersByQuestion: new Map(),
    closeTimer: null,
    finishing: false,
    lastActivityAt: Date.now(),
  };
}

describe("GameEngineService answer validation", () => {
  const engine = new GameEngineService();

  it("awards 1 point for correct on-time answer", () => {
    const room = buildRoom();
    const now = Date.now();
    const result = engine.submitAnswer(room, "student-1", true, now);
    expect(result.ack.accepted).toBe(true);
    expect(result.pointsAwarded).toBe(1);
    expect(room.participants.get("student-1")?.score).toBe(1);
  });

  it("awards 0 points for incorrect answer", () => {
    const room = buildRoom();
    const result = engine.submitAnswer(room, "student-1", false);
    expect(result.ack.accepted).toBe(true);
    expect(result.pointsAwarded).toBe(0);
    expect(room.participants.get("student-1")?.score).toBe(0);
  });

  it("rejects duplicate submissions", () => {
    const room = buildRoom();
    engine.submitAnswer(room, "student-1", true);
    const duplicate = engine.submitAnswer(room, "student-1", false);
    expect(duplicate.ack.accepted).toBe(false);
    expect(duplicate.ack.reason).toBe("duplicate");
    expect(room.participants.get("student-1")?.score).toBe(1);
  });

  it("does not award points again when the recorded answer remains", () => {
    const room = buildRoom();
    engine.submitAnswer(room, "student-1", true);
    room.answeredUserIds = new Set();

    const again = engine.submitAnswer(room, "student-1", true);

    expect(again.ack.accepted).toBe(false);
    expect(again.ack.reason).toBe("duplicate");
    expect(room.participants.get("student-1")?.score).toBe(1);
  });

  it("rejects answers after expiration", () => {
    const room = buildRoom();
    room.questionExpiresAt = Date.now() - 1;
    const late = engine.submitAnswer(room, "student-1", true);
    expect(late.ack.accepted).toBe(false);
    expect(late.ack.reason).toBe("expired");
    expect(room.answeredUserIds.size).toBe(0);
  });
});

import { ForbiddenException } from "@nestjs/common";
import { AuthUser } from "../../entities/auth-user";
import { QuizRepository } from "../../persistence/quiz.repository";
import { GameEngineService } from "./game-engine.service";
import { InMemoryRoomStore } from "./in-memory-room.store";
import { RoomManagerService } from "./room-manager.service";
import { GameSessionRepository } from "../../persistence/game-session.repository";

describe("RoomManagerService session creation", () => {
  const quizzes = { findQuizById: jest.fn() };
  const manager = new RoomManagerService(
    {} as InMemoryRoomStore,
    {} as GameEngineService,
    quizzes as unknown as QuizRepository,
    {} as GameSessionRepository,
  );
  const student: AuthUser = {
    userId: "student-1",
    email: "alumno@profelink.cr",
    role: "PARTICIPANT",
  };

  it("rejects a participant before loading the quiz", async () => {
    await expect(manager.createLiveSession(student, "quiz-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    expect(quizzes.findQuizById).not.toHaveBeenCalled();
  });
});

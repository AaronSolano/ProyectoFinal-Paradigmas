import { ForbiddenException } from "@nestjs/common";
import { AuthUser } from "../entities/auth-user";
import { QuizRepository } from "../persistence/quiz.repository";
import { QuizService } from "./quiz.service";

const host: AuthUser = { userId: "host-1", email: "profe@profelink.cr", role: "HOST" };
const student: AuthUser = { userId: "student-1", email: "alumno@profelink.cr", role: "PARTICIPANT" };

describe("QuizService host authorization", () => {
  const repo = {
    createQuiz: jest.fn(),
    findQuizById: jest.fn(),
    updateQuiz: jest.fn(),
    deleteQuiz: jest.fn(),
    createQuestion: jest.fn(),
    findQuestionById: jest.fn(),
    updateQuestion: jest.fn(),
    deleteQuestion: jest.fn(),
  };
  const service = new QuizService(repo as unknown as QuizRepository);

  beforeEach(() => {
    jest.resetAllMocks();
  });

  it("lets a host create a quiz and keeps ownership", async () => {
    repo.createQuiz.mockResolvedValue({ id: "quiz-1" });

    await service.createQuiz(host, { title: "Reto", description: "demo" });

    expect(repo.createQuiz).toHaveBeenCalledWith({
      title: "Reto",
      description: "demo",
      ownerId: "host-1",
    });
  });

  it("rejects participant create, update, and delete without writing", async () => {
    await expect(service.createQuiz(student, { title: "Reto" })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.updateQuiz(student, "quiz-1", { title: "Otro" })).rejects.toBeInstanceOf(
      ForbiddenException,
    );
    await expect(service.deleteQuiz(student, "quiz-1")).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.addQuestion(student, "quiz-1", {
        statement: "Una hora tiene cien minutos.",
        correctAnswer: false,
        timeLimitSeconds: 20,
      }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(
      service.updateQuestion(student, "quiz-1", "question-1", { statement: "Cambio" }),
    ).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.deleteQuestion(student, "quiz-1", "question-1")).rejects.toBeInstanceOf(
      ForbiddenException,
    );

    expect(repo.createQuiz).not.toHaveBeenCalled();
    expect(repo.findQuizById).not.toHaveBeenCalled();
    expect(repo.updateQuiz).not.toHaveBeenCalled();
    expect(repo.deleteQuiz).not.toHaveBeenCalled();
    expect(repo.createQuestion).not.toHaveBeenCalled();
    expect(repo.updateQuestion).not.toHaveBeenCalled();
    expect(repo.deleteQuestion).not.toHaveBeenCalled();
  });

  it("still rejects a host who does not own the quiz", async () => {
    repo.findQuizById.mockResolvedValue({ id: "quiz-1", ownerId: "other" });

    await expect(service.deleteQuiz(host, "quiz-1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.deleteQuiz).not.toHaveBeenCalled();
  });
});

import { BadRequestException, ForbiddenException } from "@nestjs/common";
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
    countQuestions: jest.fn(),
    listQuizzesByOwner: jest.fn(),
    listQuestionsByQuiz: jest.fn(),
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
      category: undefined,
      published: false,
      ownerId: "host-1",
    });
  });

  it("stores the chosen category and always creates the quiz private", async () => {
    repo.createQuiz.mockResolvedValue({ id: "quiz-1", category: "cultura_general", published: false });

    const view = await service.createQuiz(host, { title: "Reto", category: "cultura-general" });

    expect(repo.createQuiz).toHaveBeenCalledWith(
      expect.objectContaining({ category: "cultura_general", published: false }),
    );
    expect(view.category).toBe("cultura-general");
  });

  it("rejects participant reads of quizzes and questions", async () => {
    await expect(service.listQuizzes(student)).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.getQuiz(student, "quiz-1")).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.listQuestions(student, "quiz-1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.listQuizzesByOwner).not.toHaveBeenCalled();
    expect(repo.findQuizById).not.toHaveBeenCalled();
    expect(repo.listQuestionsByQuiz).not.toHaveBeenCalled();
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

  describe("publication", () => {
    const owned = { id: "quiz-1", ownerId: "host-1", published: false, category: null };

    it("lets the HOST owner publish a quiz with questions and records the time", async () => {
      repo.findQuizById.mockResolvedValue(owned);
      repo.countQuestions.mockResolvedValue(2);
      repo.updateQuiz.mockResolvedValue({ ...owned, published: true });

      await service.updateQuiz(host, "quiz-1", { published: true, category: "ciencias" });

      const data = repo.updateQuiz.mock.calls[0][1];
      expect(data.published).toBe(true);
      expect(data.publishedAt).toBeInstanceOf(Date);
      expect(data.category).toBe("ciencias");
    });

    it("answers 403 and writes nothing when another user edits or publishes", async () => {
      repo.findQuizById.mockResolvedValue({ ...owned, ownerId: "other" });

      await expect(service.updateQuiz(host, "quiz-1", { published: true })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      await expect(service.updateQuiz(host, "quiz-1", { category: "historia" })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.updateQuiz).not.toHaveBeenCalled();
    });

    it("answers 403 to a participant who tries to publish", async () => {
      await expect(service.updateQuiz(student, "quiz-1", { published: true })).rejects.toBeInstanceOf(
        ForbiddenException,
      );
      expect(repo.updateQuiz).not.toHaveBeenCalled();
    });

    it("rejects publishing a quiz with zero questions and leaves it unpublished", async () => {
      repo.findQuizById.mockResolvedValue(owned);
      repo.countQuestions.mockResolvedValue(0);

      await expect(service.updateQuiz(host, "quiz-1", { published: true })).rejects.toBeInstanceOf(
        BadRequestException,
      );
      expect(repo.updateQuiz).not.toHaveBeenCalled();
    });

    it("unpublishes and clears the publication time", async () => {
      repo.findQuizById.mockResolvedValue({ ...owned, published: true });
      repo.updateQuiz.mockResolvedValue({ ...owned });

      await service.updateQuiz(host, "quiz-1", { published: false });

      expect(repo.updateQuiz.mock.calls[0][1]).toEqual(
        expect.objectContaining({ published: false, publishedAt: null }),
      );
    });
  });
});



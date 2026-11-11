import { NotFoundException } from "@nestjs/common";
import { AuthUser } from "../entities/auth-user";
import { QuizRepository } from "../persistence/quiz.repository";
import { QuizLibraryService } from "./quiz-library.service";
import { ForbiddenException } from "@nestjs/common";

const host: AuthUser = { userId: "host-2", email: "otro@profelink.cr", role: "HOST" };
const student: AuthUser = { userId: "s-1", email: "alumno@profelink.cr", role: "PARTICIPANT" };

describe("QuizLibraryService", () => {
  const repo = {
    listPublished: jest.fn(),
    findPublishedWithQuestions: jest.fn(),
    copyPublished: jest.fn(),
  };
  const service = new QuizLibraryService(repo as unknown as QuizRepository);

  beforeEach(() => jest.resetAllMocks());

  it("lists published quizzes with page, size, total and category code", async () => {
    repo.listPublished.mockResolvedValue({
      items: [{ id: "q1", category: "cultura_general", published: true, questionCount: 3 }],
      total: 41,
    });

    const result = await service.list(host, { category: "cultura-general", page: 2 });

    expect(repo.listPublished).toHaveBeenCalledWith({ category: "cultura-general", page: 2, pageSize: 20 });
    expect(result).toMatchObject({ page: 2, pageSize: 20, total: 41 });
    expect(result.items[0]).toMatchObject({ category: "cultura-general", questionCount: 3 });
  });

  it("hides private and missing quizzes behind the same 404", async () => {
    repo.findPublishedWithQuestions.mockResolvedValue(null);
    repo.copyPublished.mockResolvedValue(null);

    await expect(service.detail(host, "q-private")).rejects.toBeInstanceOf(NotFoundException);
    await expect(service.copy(host, "q-private")).rejects.toBeInstanceOf(NotFoundException);
  });

  it("returns questions with correct answers for a published quiz", async () => {
    repo.findPublishedWithQuestions.mockResolvedValue({
      id: "q1",
      category: null,
      questions: [{ id: "x", statement: "S", correctAnswer: true }],
    });

    const detail = await service.detail(host, "q1");

    expect(detail.questions[0]).toMatchObject({ statement: "S", correctAnswer: true });
  });

  it("copies on behalf of the caller", async () => {
    repo.copyPublished.mockResolvedValue({ id: "copy", ownerId: "host-2", category: null, questions: [] });

    await service.copy(host, "q1");

    expect(repo.copyPublished).toHaveBeenCalledWith("q1", "host-2");
  });

  it("rejects participants without touching the repository", async () => {
    await expect(service.list(student, {})).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.detail(student, "q1")).rejects.toBeInstanceOf(ForbiddenException);
    await expect(service.copy(student, "q1")).rejects.toBeInstanceOf(ForbiddenException);
    expect(repo.listPublished).not.toHaveBeenCalled();
    expect(repo.findPublishedWithQuestions).not.toHaveBeenCalled();
    expect(repo.copyPublished).not.toHaveBeenCalled();
  });
});

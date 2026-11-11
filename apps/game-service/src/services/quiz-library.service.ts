import { Injectable, NotFoundException } from "@nestjs/common";
import { AuthUser } from "../entities/auth-user";
import {
  LibraryQuizDetail,
  LibraryQuizSummary,
  toQuizView,
} from "../persistence/quiz-category";
import { QuizRepository } from "../persistence/quiz.repository";
import { LibraryQuizQueryDto } from "../presentation/dto/library-quiz-query.dto";
import { assertHost } from "./host-access";

const NOT_FOUND = "Cuestionario no encontrado.";

@Injectable()
export class QuizLibraryService {
  constructor(private readonly quizzes: QuizRepository) {}

  async list(user: AuthUser, query: LibraryQuizQueryDto) {
    assertHost(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 20;
    const result = await this.quizzes.listPublished({
      category: query.category,
      page,
      pageSize,
    });
    const items: LibraryQuizSummary[] = result.items.map(({ questionCount, ...quiz }) => ({
      ...toQuizView(quiz),
      questionCount,
    }));
    return { items, page, pageSize, total: result.total };
  }

  async detail(user: AuthUser, quizId: string): Promise<LibraryQuizDetail> {
    assertHost(user);
    const quiz = await this.quizzes.findPublishedWithQuestions(quizId);
    if (!quiz) {
      throw new NotFoundException(NOT_FOUND);
    }
    const { questions, ...rest } = quiz;
    return { ...toQuizView(rest), questions };
  }

  async copy(user: AuthUser, quizId: string): Promise<LibraryQuizDetail> {
    assertHost(user);
    const copy = await this.quizzes.copyPublished(quizId, user.userId);
    if (!copy) {
      throw new NotFoundException(NOT_FOUND);
    }
    const { questions, ...rest } = copy;
    return { ...toQuizView(rest), questions };
  }
}

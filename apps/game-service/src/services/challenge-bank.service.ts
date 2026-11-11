import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { ChallengeCategory, ChallengePrompt, Question } from "@profelink/game-prisma";
import { AuthUser } from "../entities/auth-user";
import {
  ChallengeCategoryCode,
  CHALLENGE_CATEGORIES,
} from "../persistence/challenge-bank.catalog";
import {
  ChallengeBankRepository,
  MissingChallengePromptsError,
} from "../persistence/challenge-bank.repository";
import { QuizRepository } from "../persistence/quiz.repository";
import { CopyChallengePromptsDto } from "../presentation/dto/copy-challenge-prompts.dto";
import { ChallengePromptQueryDto } from "../presentation/dto/challenge-prompt-query.dto";
import { assertHost } from "./host-access";

const CATEGORY_TO_CODE: Record<ChallengeCategory, ChallengeCategoryCode> = {
  [ChallengeCategory.cultura_general]: "cultura-general",
  [ChallengeCategory.ciencias]: "ciencias",
  [ChallengeCategory.tecnologia]: "tecnologia",
  [ChallengeCategory.historia]: "historia",
  [ChallengeCategory.geografia]: "geografia",
  [ChallengeCategory.deportes]: "deportes",
};

export type ChallengePromptItem = {
  id: string;
  statement: string;
  correctAnswer: boolean;
  category: ChallengeCategoryCode;
  difficulty: string;
  suggestedTimeLimitSeconds: number;
  imageUrl: string | null;
};

@Injectable()
export class ChallengeBankService {
  constructor(
    private readonly bank: ChallengeBankRepository,
    private readonly quizzes: QuizRepository,
  ) {}

  async search(user: AuthUser, query: ChallengePromptQueryDto) {
    assertHost(user);
    const page = query.page ?? 1;
    const pageSize = query.pageSize ?? 12;
    const result = await this.bank.search({
      q: query.q,
      category: query.category,
      difficulty: query.difficulty,
      page,
      pageSize,
    });
    return {
      items: result.items.map((item) => this.toItem(item)),
      page,
      pageSize,
      total: result.total,
    };
  }

  async copyIntoQuiz(
    user: AuthUser,
    quizId: string,
    dto: CopyChallengePromptsDto,
  ): Promise<Question[]> {
    assertHost(user);
    if (new Set(dto.promptIds).size !== dto.promptIds.length) {
      throw new BadRequestException("La selección contiene identificadores repetidos.");
    }

    const quiz = await this.quizzes.findQuizById(quizId);
    if (!quiz) {
      throw new NotFoundException("Cuestionario no encontrado.");
    }
    if (quiz.ownerId !== user.userId) {
      throw new ForbiddenException("No tiene permiso para modificar este cuestionario.");
    }

    try {
      return await this.bank.copyPrompts(quizId, dto.promptIds);
    } catch (error) {
      if (error instanceof MissingChallengePromptsError) {
        throw new NotFoundException("Uno o más retos no existen.");
      }
      throw error;
    }
  }

  private toItem(prompt: ChallengePrompt): ChallengePromptItem {
    const category = CATEGORY_TO_CODE[prompt.category];
    if (!CHALLENGE_CATEGORIES.includes(category)) {
      throw new Error("Categoría de banco no reconocida.");
    }
    return {
      id: prompt.id,
      statement: prompt.statement,
      correctAnswer: prompt.correctAnswer,
      category,
      difficulty: prompt.difficulty,
      suggestedTimeLimitSeconds: prompt.suggestedTimeLimitSeconds,
      imageUrl: prompt.imageUrl,
    };
  }
}

import { Injectable } from "@nestjs/common";
import {
  ChallengeCategory,
  ChallengeDifficulty,
  Prisma,
  Question,
} from "@profelink/game-prisma";
import {
  ChallengeCategoryCode,
  ChallengeDifficultyCode,
} from "./challenge-bank.catalog";
import { PrismaService } from "./prisma.service";

const CATEGORY_TO_ENUM: Record<ChallengeCategoryCode, ChallengeCategory> = {
  "cultura-general": ChallengeCategory.cultura_general,
  ciencias: ChallengeCategory.ciencias,
  tecnologia: ChallengeCategory.tecnologia,
  historia: ChallengeCategory.historia,
  geografia: ChallengeCategory.geografia,
  deportes: ChallengeCategory.deportes,
};

const DIFFICULTY_TO_ENUM: Record<ChallengeDifficultyCode, ChallengeDifficulty> = {
  facil: ChallengeDifficulty.facil,
  intermedia: ChallengeDifficulty.intermedia,
  dificil: ChallengeDifficulty.dificil,
};

export type ChallengePromptQuery = {
  q?: string;
  category?: ChallengeCategoryCode;
  difficulty?: ChallengeDifficultyCode;
  page: number;
  pageSize: number;
};

export class MissingChallengePromptsError extends Error {
  constructor() {
    super("MISSING_PROMPTS");
  }
}

@Injectable()
export class ChallengeBankRepository {
  constructor(private readonly prisma: PrismaService) {}

  async search(query: ChallengePromptQuery) {
    const where = this.where(query);
    const [items, total] = await Promise.all([
      this.prisma.challengePrompt.findMany({
        where,
        orderBy: [{ statement: "asc" }, { id: "asc" }],
        skip: (query.page - 1) * query.pageSize,
        take: query.pageSize,
      }),
      this.prisma.challengePrompt.count({ where }),
    ]);
    return { items, total };
  }

  copyPrompts(quizId: string, promptIds: readonly string[]): Promise<Question[]> {
    return this.prisma.$transaction((tx) => this.copyInTransaction(tx, quizId, promptIds));
  }

  private where(query: ChallengePromptQuery): Prisma.ChallengePromptWhereInput {
    return {
      ...(query.q ? { statement: { contains: query.q, mode: "insensitive" } } : {}),
      ...(query.category ? { category: CATEGORY_TO_ENUM[query.category] } : {}),
      ...(query.difficulty ? { difficulty: DIFFICULTY_TO_ENUM[query.difficulty] } : {}),
    };
  }

  private async copyInTransaction(
    tx: Prisma.TransactionClient,
    quizId: string,
    promptIds: readonly string[],
  ): Promise<Question[]> {
    const found = await tx.challengePrompt.findMany({
      where: { id: { in: [...promptIds] } },
    });
    if (found.length !== promptIds.length) {
      throw new MissingChallengePromptsError();
    }

    const byId = new Map(found.map((prompt) => [prompt.id, prompt]));
    const max = await tx.question.aggregate({
      where: { quizId },
      _max: { sortOrder: true },
    });
    let sortOrder = (max._max.sortOrder ?? -1) + 1;
    const created: Question[] = [];
    for (const id of promptIds) {
      const prompt = byId.get(id);
      if (!prompt) {
        throw new MissingChallengePromptsError();
      }
      created.push(
        await tx.question.create({
          data: {
            quiz: { connect: { id: quizId } },
            statement: prompt.statement,
            imageUrl: prompt.imageUrl,
            correctAnswer: prompt.correctAnswer,
            timeLimitSeconds: prompt.suggestedTimeLimitSeconds,
            sortOrder,
          },
        }),
      );
      sortOrder += 1;
    }
    return created;
  }
}

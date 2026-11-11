import { ChallengeCategory, Question, Quiz } from "@profelink/game-prisma";
import {
  CHALLENGE_CATEGORIES,
  ChallengeCategoryCode,
} from "./challenge-bank.catalog";

export const CATEGORY_CODE_TO_ENUM: Record<ChallengeCategoryCode, ChallengeCategory> = {
  "cultura-general": ChallengeCategory.cultura_general,
  ciencias: ChallengeCategory.ciencias,
  tecnologia: ChallengeCategory.tecnologia,
  historia: ChallengeCategory.historia,
  geografia: ChallengeCategory.geografia,
  deportes: ChallengeCategory.deportes,
};

const ENUM_TO_CODE: Record<ChallengeCategory, ChallengeCategoryCode> = {
  [ChallengeCategory.cultura_general]: "cultura-general",
  [ChallengeCategory.ciencias]: "ciencias",
  [ChallengeCategory.tecnologia]: "tecnologia",
  [ChallengeCategory.historia]: "historia",
  [ChallengeCategory.geografia]: "geografia",
  [ChallengeCategory.deportes]: "deportes",
};

export type QuizView = Omit<Quiz, "category"> & { category: ChallengeCategoryCode | null };

export type LibraryQuizSummary = QuizView & { questionCount: number };

export type LibraryQuizDetail = QuizView & { questions: Question[] };

export function isCategoryCode(value: string): value is ChallengeCategoryCode {
  return (CHALLENGE_CATEGORIES as readonly string[]).includes(value);
}

/** Public API shape: the category is exposed as its hyphenated code. */
export function toQuizView(quiz: Quiz): QuizView {
  return { ...quiz, category: quiz.category ? ENUM_TO_CODE[quiz.category] : null };
}

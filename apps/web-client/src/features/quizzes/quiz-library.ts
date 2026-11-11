import { CHALLENGE_CATEGORIES, type ChallengeCategoryCode } from "./catalog";

export const LIBRARY_PAGE_SIZE = 20;

export function isCategoryCode(value: string): value is ChallengeCategoryCode {
  return (CHALLENGE_CATEGORIES as readonly string[]).includes(value);
}

/** The new-quiz form must carry exactly one of the six categories. */
export function newQuizCategoryError(category: string): string | null {
  return isCategoryCode(category) ? null : "Elige una categoría para el cuestionario.";
}

/** Publishing needs at least one question; the server answers 400 otherwise. */
export function publishBlockedReason(questionCount: number): string | null {
  return questionCount > 0 ? null : "Agrega al menos una pregunta antes de publicar.";
}

export function libraryListPath(filters: { category: ChallengeCategoryCode | ""; page: number }): string {
  const params = new URLSearchParams();
  if (filters.category) {
    params.set("category", filters.category);
  }
  params.set("page", String(filters.page));
  params.set("pageSize", String(LIBRARY_PAGE_SIZE));
  return `/api/library/quizzes?${params.toString()}`;
}

export function libraryHasNextPage(page: number, total: number): boolean {
  return page * LIBRARY_PAGE_SIZE < total;
}

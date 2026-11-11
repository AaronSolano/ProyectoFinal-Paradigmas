export const CHALLENGE_CATEGORIES = [
  "cultura-general",
  "ciencias",
  "tecnologia",
  "historia",
  "geografia",
  "deportes",
] as const;

export const CHALLENGE_DIFFICULTIES = ["facil", "intermedia", "dificil"] as const;

export type ChallengeCategoryCode = (typeof CHALLENGE_CATEGORIES)[number];
export type ChallengeDifficultyCode = (typeof CHALLENGE_DIFFICULTIES)[number];

export const CATEGORY_LABELS: Record<ChallengeCategoryCode, string> = {
  "cultura-general": "Cultura general",
  ciencias: "Ciencias",
  tecnologia: "Tecnología",
  historia: "Historia",
  geografia: "Geografía",
  deportes: "Deportes",
};

export const DIFFICULTY_LABELS: Record<ChallengeDifficultyCode, string> = {
  facil: "Fácil",
  intermedia: "Intermedia",
  dificil: "Difícil",
};

export const SELECTION_LIMIT = 20;

export type PromptFilters = {
  q: string;
  category: ChallengeCategoryCode | "";
  difficulty: ChallengeDifficultyCode | "";
  page: number;
};

export function searchTextIsReady(q: string): boolean {
  const trimmed = q.trim();
  return trimmed.length === 0 || trimmed.length >= 2;
}

export function challengePromptPath(filters: PromptFilters): string {
  const params = new URLSearchParams();
  const q = filters.q.trim();
  if (q.length >= 2) {
    params.set("q", q);
  }
  if (filters.category) {
    params.set("category", filters.category);
  }
  if (filters.difficulty) {
    params.set("difficulty", filters.difficulty);
  }
  params.set("page", String(filters.page));
  params.set("pageSize", "12");
  return `/api/challenge-prompts?${params.toString()}`;
}

export function togglePromptSelection(selected: readonly string[], id: string): {
  ids: string[];
  rejected: boolean;
} {
  if (selected.includes(id)) {
    return { ids: selected.filter((item) => item !== id), rejected: false };
  }
  if (selected.length >= SELECTION_LIMIT) {
    return { ids: [...selected], rejected: true };
  }
  return { ids: [...selected, id], rejected: false };
}

import { gameRequest } from "../../shared/game-api";
import { readClientEnv } from "../../shared/env";
import { requestForm } from "../../shared/http";
import { challengePromptPath, type PromptFilters } from "./catalog";

export type QuizSummary = {
  id: string;
  ownerId: string;
  title: string;
  description: string | null;
};

export type QuizQuestion = {
  id: string;
  quizId: string;
  statement: string;
  imageUrl: string | null;
  correctAnswer: boolean;
  timeLimitSeconds: number;
  sortOrder: number;
};

export type ChallengePromptItem = {
  id: string;
  statement: string;
  correctAnswer: boolean;
  category: string;
  difficulty: string;
  suggestedTimeLimitSeconds: number;
  imageUrl: string | null;
};

export type ChallengePromptPage = {
  items: ChallengePromptItem[];
  page: number;
  pageSize: number;
  total: number;
};

export function listQuizzes(token: string): Promise<QuizSummary[]> {
  return gameRequest<QuizSummary[]>("/api/quizzes", token);
}

export function createQuiz(
  token: string,
  body: { title: string; description?: string },
): Promise<QuizSummary> {
  return gameRequest<QuizSummary>("/api/quizzes", token, { method: "POST", body });
}

export function updateQuiz(
  token: string,
  quizId: string,
  body: { title?: string; description?: string },
): Promise<QuizSummary> {
  return gameRequest<QuizSummary>(`/api/quizzes/${quizId}`, token, { method: "PATCH", body });
}

export function deleteQuiz(token: string, quizId: string): Promise<QuizSummary> {
  return gameRequest<QuizSummary>(`/api/quizzes/${quizId}`, token, { method: "DELETE" });
}

export function listQuestions(token: string, quizId: string): Promise<QuizQuestion[]> {
  return gameRequest<QuizQuestion[]>(`/api/quizzes/${quizId}/questions`, token);
}

export function createQuestion(
  token: string,
  quizId: string,
  body: {
    statement: string;
    correctAnswer: boolean;
    timeLimitSeconds: number;
    imageUrl?: string;
    sortOrder?: number;
  },
): Promise<QuizQuestion> {
  return gameRequest<QuizQuestion>(`/api/quizzes/${quizId}/questions`, token, { method: "POST", body });
}

export function updateQuestion(
  token: string,
  quizId: string,
  questionId: string,
  body: {
    statement?: string;
    correctAnswer?: boolean;
    timeLimitSeconds?: number;
    imageUrl?: string;
    sortOrder?: number;
  },
): Promise<QuizQuestion> {
  return gameRequest<QuizQuestion>(`/api/quizzes/${quizId}/questions/${questionId}`, token, {
    method: "PATCH",
    body,
  });
}

export function deleteQuestion(token: string, quizId: string, questionId: string): Promise<QuizQuestion> {
  return gameRequest<QuizQuestion>(`/api/quizzes/${quizId}/questions/${questionId}`, token, {
    method: "DELETE",
  });
}

export function searchPrompts(token: string, filters: PromptFilters): Promise<ChallengePromptPage> {
  return gameRequest<ChallengePromptPage>(challengePromptPath(filters), token);
}

export function copyPrompts(
  token: string,
  quizId: string,
  promptIds: readonly string[],
): Promise<QuizQuestion[]> {
  return gameRequest<QuizQuestion[]>(`/api/quizzes/${quizId}/questions/from-bank`, token, {
    method: "POST",
    body: { promptIds },
  });
}

export function uploadQuestionImage(token: string, file: File): Promise<{ url: string }> {
  const body = new FormData();
  body.append("file", file);
  const { gameApiUrl } = readClientEnv();
  return requestForm<{ url: string }>(`${gameApiUrl}/api/upload`, token, body);
}

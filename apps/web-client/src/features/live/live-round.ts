import type { LeaderboardEntry, QuestionOpenedPublic } from "@profelink/shared-dtos";

export type OpenQuestionView = {
  questionId: string;
  questionIndex: number;
  statement: string;
  imageUrl: string | null;
  expiresAt: number;
};

const NEXT_QUESTION_PREFIX = "verix.nextQuestion.";

export function remainingSeconds(expiresAt: number, now: number): number {
  return Math.max(0, Math.floor((expiresAt - now) / 1000));
}

export function toOpenQuestion(payload: QuestionOpenedPublic): OpenQuestionView {
  return {
    questionId: payload.questionId,
    questionIndex: payload.questionIndex,
    statement: payload.statement,
    imageUrl: payload.imageUrl ?? null,
    expiresAt: payload.expiresAt,
  };
}

export function questionImageSrc(imageUrl: string | null, gameApiUrl: string): string | null {
  if (!imageUrl) {
    return null;
  }
  if (imageUrl.startsWith("http://") || imageUrl.startsWith("https://")) {
    return imageUrl;
  }
  const origin = gameApiUrl.replace(/\/$/, "");
  return `${origin}${imageUrl.startsWith("/") ? imageUrl : `/${imageUrl}`}`;
}

export function questionLabel(questionIndex: number): string {
  return `Pregunta ${questionIndex + 1}`;
}

export function answerFeedback(submitted: boolean | null, correctAnswer: boolean): string {
  if (submitted === null) {
    return "No hay una respuesta tuya para comparar. El puntaje está en la clasificación.";
  }
  return submitted === correctAnswer
    ? "Respuesta correcta. Sumaste 1 punto."
    : "Respuesta incorrecta. Sumaste 0 puntos.";
}

export function scoreOnLeaderboard(
  leaderboard: readonly LeaderboardEntry[],
  userId: string,
): LeaderboardEntry | null {
  return leaderboard.find((entry) => entry.userId === userId) ?? null;
}

export function canSubmitAnswer(locked: boolean, connected: boolean, questionOpen: boolean): boolean {
  return questionOpen && connected && !locked;
}

export function answerAckMessage(accepted: boolean, reason?: string): string {
  if (accepted) {
    return "Respuesta enviada. Esperando el cierre de la pregunta.";
  }
  if (reason === "duplicate") {
    return "Esta pregunta ya tiene tu respuesta.";
  }
  if (reason === "expired") {
    return "El tiempo de la pregunta terminó.";
  }
  if (reason === "no_active_question") {
    return "No hay una pregunta abierta.";
  }
  if (reason === "unauthorized") {
    return "El profesor no responde el reto.";
  }
  return "La sala no aceptó la respuesta.";
}

export function rememberNextQuestion(roomCode: string, openedIndex: number): void {
  sessionStorage.setItem(`${NEXT_QUESTION_PREFIX}${roomCode}`, String(openedIndex + 1));
}

export function readNextQuestion(roomCode: string): number {
  const value = Number(sessionStorage.getItem(`${NEXT_QUESTION_PREFIX}${roomCode}`));
  return Number.isInteger(value) && value >= 0 ? value : 0;
}

export function hostActionLabel(questionIndex: number): string {
  return questionIndex === 0 ? "Iniciar juego" : "Siguiente pregunta";
}

export function questionsExhausted(message: string): boolean {
  return message === "Índice de pregunta inválido.";
}

export function canOfferFinish(exhausted: boolean, questionOpen: boolean, finished: boolean): boolean {
  return exhausted && !questionOpen && !finished;
}

export function shouldEmitFinish(confirmed: boolean, sending: boolean): boolean {
  return confirmed && !sending;
}

export function finishPresentation(error: string | null, received: boolean): "error" | "done" | "idle" {
  if (error && !received) {
    return "error";
  }
  if (received) {
    return "done";
  }
  return "idle";
}

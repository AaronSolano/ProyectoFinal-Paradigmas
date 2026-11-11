import type { QuestionOpenedPublic } from "@profelink/shared-dtos";
import {
  answerAckMessage,
  answerFeedback,
  canSubmitAnswer,
  hostActionLabel,
  questionImageSrc,
  questionLabel,
  canOfferFinish,
  finishPresentation,
  questionsExhausted,
  readNextQuestion,
  shouldEmitFinish,
  remainingSeconds,
  rememberNextQuestion,
  scoreOnLeaderboard,
  toOpenQuestion,
} from "./live-round";

describe("ronda en vivo", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("cuenta el tiempo desde expiresAt y no baja de cero", () => {
    expect(remainingSeconds(10_500, 10_000)).toBe(0);
    expect(remainingSeconds(12_000, 10_000)).toBe(2);
    expect(remainingSeconds(9_000, 10_000)).toBe(0);
  });

  it("muestra la pregunta abierta sin la respuesta correcta", () => {
    const payload = {
      questionId: "q1",
      questionIndex: 0,
      statement: "La Tierra gira.",
      imageUrl: "/uploads/tierra.webp",
      expiresAt: 20_000,
      correctAnswer: true,
    } as QuestionOpenedPublic & { correctAnswer: boolean };

    const view = toOpenQuestion(payload);

    expect(view).toEqual({
      questionId: "q1",
      questionIndex: 0,
      statement: "La Tierra gira.",
      imageUrl: "/uploads/tierra.webp",
      expiresAt: 20_000,
    });
    expect(view).not.toHaveProperty("correctAnswer");
    expect(questionLabel(0)).toBe("Pregunta 1");
    expect(questionImageSrc(view.imageUrl, "http://localhost:3002/")).toBe(
      "http://localhost:3002/uploads/tierra.webp",
    );
  });

  it("bloquea una segunda respuesta y explica el acuse", () => {
    expect(canSubmitAnswer(false, true, true)).toBe(true);
    expect(canSubmitAnswer(true, true, true)).toBe(false);
    expect(canSubmitAnswer(false, false, true)).toBe(false);
    expect(answerAckMessage(true)).toBe("Respuesta enviada. Esperando el cierre de la pregunta.");
    expect(answerAckMessage(false, "duplicate")).toBe("Esta pregunta ya tiene tu respuesta.");
  });

  it("compara la respuesta enviada y lee el puntaje del servidor", () => {
    expect(answerFeedback(true, true)).toBe("Respuesta correcta. Sumaste 1 punto.");
    expect(answerFeedback(false, true)).toBe("Respuesta incorrecta. Sumaste 0 puntos.");
    const leaderboard = [
      { userId: "student-1", displayName: "Ana", score: 1, rank: 1 },
      { userId: "student-2", displayName: "Bea", score: 0, rank: 2 },
    ];

    expect(scoreOnLeaderboard(leaderboard, "student-1")?.score).toBe(1);
    expect(scoreOnLeaderboard(leaderboard, "host-1")).toBeNull();
  });

  it("avanza el índice y reconoce cuando no hay más preguntas", () => {
    expect(hostActionLabel(0)).toBe("Iniciar juego");
    expect(hostActionLabel(1)).toBe("Siguiente pregunta");
    rememberNextQuestion("PL-AB12", 0);
    expect(readNextQuestion("PL-AB12")).toBe(1);
    expect(questionsExhausted("Índice de pregunta inválido.")).toBe(true);
    expect(questionsExhausted("Esta pregunta ya fue abierta.")).toBe(false);
  });

  it("ofrece finalizar solo al cerrar la última pregunta y conserva el error del servidor", () => {
    expect(canOfferFinish(false, false, false)).toBe(false);
    expect(canOfferFinish(true, true, false)).toBe(false);
    expect(canOfferFinish(true, false, false)).toBe(true);
    expect(canOfferFinish(true, false, true)).toBe(false);
    expect(shouldEmitFinish(false, false)).toBe(false);
    expect(shouldEmitFinish(true, true)).toBe(false);
    expect(shouldEmitFinish(true, false)).toBe(true);
    expect(finishPresentation("Aún hay preguntas pendientes.", false)).toBe("error");
    expect(finishPresentation(null, true)).toBe("done");
  });
});

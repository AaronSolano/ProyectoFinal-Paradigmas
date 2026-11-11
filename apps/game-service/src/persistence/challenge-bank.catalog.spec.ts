import {
  CHALLENGE_BANK,
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  mergeByStatement,
  toChallengePromptWrite,
} from "./challenge-bank.catalog";

describe("challenge bank catalog", () => {
  it("contiene 60 retos únicos con la distribución prevista", () => {
    expect(CHALLENGE_BANK).toHaveLength(60);
    expect(new Set(CHALLENGE_BANK.map((item) => item.statement)).size).toBe(60);

    for (const category of CHALLENGE_CATEGORIES) {
      const items = CHALLENGE_BANK.filter((item) => item.category === category);
      expect(items).toHaveLength(10);
      expect(items.filter((item) => item.difficulty === "facil")).toHaveLength(4);
      expect(items.filter((item) => item.difficulty === "intermedia")).toHaveLength(3);
      expect(items.filter((item) => item.difficulty === "dificil")).toHaveLength(3);
      expect(items.filter((item) => item.correctAnswer).length).toBe(5);
      expect(items.filter((item) => !item.correctAnswer).length).toBe(5);
    }

    const trueCount = CHALLENGE_BANK.filter((item) => item.correctAnswer).length;
    expect(trueCount).toBe(30);
    expect(CHALLENGE_BANK.length - trueCount).toBe(30);
  });

  it("solo usa categorías, dificultades y tiempos permitidos", () => {
    for (const item of CHALLENGE_BANK) {
      expect(CHALLENGE_CATEGORIES).toContain(item.category);
      expect(CHALLENGE_DIFFICULTIES).toContain(item.difficulty);
      expect(item.statement.trim().length).toBeGreaterThanOrEqual(3);
      expect(item.suggestedTimeLimitSeconds).toBeGreaterThanOrEqual(5);
      expect(typeof item.correctAnswer).toBe("boolean");
    }
  });

  it("repite el catálogo como actualizaciones y no como filas nuevas", () => {
    const first = mergeByStatement([], CHALLENGE_BANK);
    const second = mergeByStatement(
      CHALLENGE_BANK.map((item) => item.statement),
      CHALLENGE_BANK,
    );

    expect(first).toEqual({ created: 60, updated: 0, total: 60 });
    expect(second).toEqual({ created: 0, updated: 60, total: 60 });
  });

  it("prepara un upsert por enunciado sin cambiar la clave ni crear otra fila", () => {
    const write = toChallengePromptWrite(CHALLENGE_BANK[0]);

    expect(write.where).toEqual({ statement: CHALLENGE_BANK[0].statement });
    expect(write.update).not.toHaveProperty("statement");
    expect(write.update).not.toHaveProperty("id");
    expect(write.create.statement).toBe(CHALLENGE_BANK[0].statement);
    expect(write.create.imageUrl).toBeNull();
  });
});

import { challengePromptPath, searchTextIsReady, togglePromptSelection } from "./catalog";

describe("consulta del banco", () => {
  it("arma la consulta con categoría, dificultad y texto de al menos 2 caracteres", () => {
    const path = challengePromptPath({
      q: "  hora ",
      category: "historia",
      difficulty: "dificil",
      page: 2,
    });

    expect(path).toBe(
      "/api/challenge-prompts?q=hora&category=historia&difficulty=dificil&page=2&pageSize=12",
    );
  });

  it("omite un texto demasiado corto y acepta la búsqueda vacía", () => {
    expect(searchTextIsReady("a")).toBe(false);
    expect(searchTextIsReady("  ")).toBe(true);
    expect(challengePromptPath({ q: "a", category: "", difficulty: "", page: 1 })).toBe(
      "/api/challenge-prompts?page=1&pageSize=12",
    );
  });

  it("limita la selección a 20 identificadores", () => {
    const initial = Array.from({ length: 20 }, (_, index) => `id-${index}`);
    const rejected = togglePromptSelection(initial, "id-extra");
    const removed = togglePromptSelection(initial, "id-0");

    expect(rejected.rejected).toBe(true);
    expect(rejected.ids).toHaveLength(20);
    expect(rejected.ids).not.toContain("id-extra");
    expect(removed.ids).toHaveLength(19);
    expect(removed.rejected).toBe(false);
  });
});

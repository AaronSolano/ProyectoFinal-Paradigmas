import { resolveQuizSelection } from "./quiz-selection";

describe("selección local de cuestionarios", () => {
  const ids = ["quiz-a", "quiz-b"];

  it("conserva una selección que sigue en la lista", () => {
    expect(resolveQuizSelection(ids, "quiz-b")).toBe("quiz-b");
  });

  it("elige el primero cuando no hay selección válida", () => {
    expect(resolveQuizSelection(ids, null)).toBe("quiz-a");
    expect(resolveQuizSelection(ids, "ausente")).toBe("quiz-a");
  });

  it("no inventa un cuestionario si la lista está vacía", () => {
    expect(resolveQuizSelection([], null)).toBeNull();
  });
});

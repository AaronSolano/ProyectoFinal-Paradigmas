import {
  isCategoryCode,
  libraryHasNextPage,
  libraryListPath,
  newQuizCategoryError,
  publishBlockedReason,
} from "./quiz-library";

describe("categoría y publicación", () => {
  it("acepta solo las seis categorías con guion", () => {
    expect(isCategoryCode("cultura-general")).toBe(true);
    expect(isCategoryCode("cultura_general")).toBe(false);
    expect(isCategoryCode("")).toBe(false);
    expect(newQuizCategoryError("")).not.toBeNull();
    expect(newQuizCategoryError("deportes")).toBeNull();
  });

  it("no deja publicar un cuestionario sin preguntas", () => {
    expect(publishBlockedReason(0)).not.toBeNull();
    expect(publishBlockedReason(1)).toBeNull();
  });

  it("arma la consulta de la biblioteca con máximo 20 por página", () => {
    expect(libraryListPath({ category: "", page: 1 })).toBe("/api/library/quizzes?page=1&pageSize=20");
    expect(libraryListPath({ category: "cultura-general", page: 2 })).toBe(
      "/api/library/quizzes?category=cultura-general&page=2&pageSize=20",
    );
    expect(libraryHasNextPage(1, 21)).toBe(true);
    expect(libraryHasNextPage(2, 40)).toBe(false);
  });
});

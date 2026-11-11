import { questionTimeLimitError } from "./question-time";

describe("question time limits", () => {
  it("accepts the inclusive bounds of 5 and 120 seconds", () => {
    expect(questionTimeLimitError("5")).toBeNull();
    expect(questionTimeLimitError("120")).toBeNull();
  });

  it("rejects 4 and 121 seconds", () => {
    expect(questionTimeLimitError("4")).toBe(
      "El tiempo debe ser un entero entre 5 y 120 segundos.",
    );
    expect(questionTimeLimitError("121")).toBe(
      "El tiempo debe ser un entero entre 5 y 120 segundos.",
    );
  });
});

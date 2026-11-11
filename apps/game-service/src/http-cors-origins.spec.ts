import { browserWebOrigins } from "./http-cors";

describe("game CORS origins", () => {
  it("keeps only the local clients when CORS_ORIGINS is absent", () => {
    expect(browserWebOrigins("")).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  });

  it("adds exact production origins and ignores a wildcard", () => {
    expect(browserWebOrigins("*,https://verix-web.onrender.com")).toEqual([
      "http://localhost:5173",
      "http://localhost:5174",
      "https://verix-web.onrender.com",
    ]);
  });
});

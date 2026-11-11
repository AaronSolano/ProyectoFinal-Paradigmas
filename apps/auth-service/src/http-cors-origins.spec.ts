import { browserWebOrigins } from "./http-cors";

describe("auth CORS origins", () => {
  it("keeps only the local clients when CORS_ORIGINS is absent", () => {
    expect(browserWebOrigins(undefined)).toEqual(["http://localhost:5173", "http://localhost:5174"]);
  });

  it("adds exact production origins and ignores a wildcard", () => {
    expect(browserWebOrigins(" *, https://verix-web.onrender.com, https://verix-consumer.onrender.com ")).toEqual([
      "http://localhost:5173",
      "http://localhost:5174",
      "https://verix-web.onrender.com",
      "https://verix-consumer.onrender.com",
    ]);
  });
});

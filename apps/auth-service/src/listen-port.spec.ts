import { resolveListenPort } from "./listen-port";

describe("auth listen port", () => {
  it("keeps the local auth port when Render does not set PORT", () => {
    expect(resolveListenPort(undefined, "3001", 3001)).toBe(3001);
  });

  it("uses the platform port when Render sets PORT", () => {
    expect(resolveListenPort("10000", "3001", 3001)).toBe(10000);
  });

  it("falls back when the platform port is not a valid port", () => {
    expect(resolveListenPort(" ", "nope", 3001)).toBe(3001);
  });
});

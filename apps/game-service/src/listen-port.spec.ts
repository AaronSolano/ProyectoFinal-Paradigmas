import { resolveListenPort } from "./listen-port";

describe("game listen port", () => {
  it("keeps the local game port when Render does not set PORT", () => {
    expect(resolveListenPort(undefined, 3002, 3002)).toBe(3002);
  });

  it("uses the platform port when Render sets PORT", () => {
    expect(resolveListenPort("10000", "3002", 3002)).toBe(10000);
  });

  it("falls back when the platform port is not a valid port", () => {
    expect(resolveListenPort("abc", undefined, 3002)).toBe(3002);
  });
});

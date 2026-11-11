import { readClientEnv } from "./env";

describe("readClientEnv", () => {
  const valid = {
    VITE_AUTH_API_URL: "http://localhost:3001",
    VITE_GAME_API_URL: "http://localhost:3002/",
    VITE_GAME_WS_URL: "http://localhost:3002",
  };

  it("acepta las tres URLs públicas y quita la barra final", () => {
    expect(readClientEnv(valid)).toEqual({
      authApiUrl: "http://localhost:3001",
      gameApiUrl: "http://localhost:3002",
      gameWsUrl: "http://localhost:3002",
    });
  });

  it("rechaza una URL con credenciales", () => {
    expect(() =>
      readClientEnv({
        ...valid,
        VITE_AUTH_API_URL: "http://user:secret@localhost:3001",
      }),
    ).toThrow("VITE_AUTH_API_URL no debe incluir credenciales.");
  });

  it("rechaza una variable vacía", () => {
    expect(() => readClientEnv({ ...valid, VITE_GAME_WS_URL: " " })).toThrow("Falta VITE_GAME_WS_URL.");
  });
});

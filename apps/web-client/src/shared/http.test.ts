import { HttpError, requestJson } from "./http";

describe("requestJson", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("devuelve el JSON cuando la respuesta es correcta", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: true,
        status: 200,
        text: async () => JSON.stringify({ ok: true }),
      }),
    );

    await expect(requestJson("http://localhost:3002/api/sessions", { token: "sesion-prueba" })).resolves.toEqual({
      ok: true,
    });
  });

  it("traduce un 401 sin conservar el cuerpo sensible", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ accessToken: "eyJabc.def.ghi", message: "Credenciales inválidas." }),
      }),
    );

    await expect(requestJson("http://localhost:3001/api/auth/login", { method: "POST", body: {} })).rejects.toMatchObject({
      status: 401,
      message: "Correo o contraseña incorrectos.",
    });
    expect(log).not.toHaveBeenCalled();
  });

  it("informa un fallo de red sin lanzar el error original", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("socket hang up")));

    await expect(requestJson("http://localhost:3001/api/auth/login")).rejects.toBeInstanceOf(HttpError);
  });
});

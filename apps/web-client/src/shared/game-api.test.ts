import { gameRequest } from "./game-api";

describe("gameRequest", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("llama a game-service con el token en Authorization", async () => {
    const fetchMock = vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      text: async () => "[]",
    });
    vi.stubGlobal("fetch", fetchMock);

    await gameRequest("/api/sessions", "sesion-prueba");

    expect(fetchMock).toHaveBeenCalledWith(
      "http://localhost:3002/api/sessions",
      expect.objectContaining({
        method: "GET",
        headers: expect.objectContaining({
          Authorization: "Bearer sesion-prueba",
        }),
      }),
    );
  });
});

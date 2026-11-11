import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { ConsumerPage } from "./consumer-page";

const user = { id: "user-1", email: "docente@example.com", displayName: "Docente", role: "HOST" };
const summary = {
  roomCode: "PL-HRAG",
  finishedAt: "2026-11-10T18:00:00.000Z",
  participants: [{ userId: "ana", displayName: "Ana Demo", score: 1, rank: 1 }],
};
const detail = {
  ...summary,
  podium: [{ userId: "ana", displayName: "Ana Demo", score: 1, position: 1 }],
};

function json(status: number, body: unknown): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}

function renderPage() {
  return render(<ConsumerPage />);
}

async function signIn(fetchMock: ReturnType<typeof vi.fn>) {
  fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "docente@example.com" } });
  fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba" } });
  fireEvent.click(screen.getByRole("button", { name: "Entrar" }));
  await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(2));
}

describe("consumidor externo", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.restoreAllMocks();
  });

  it("no consulta resultados antes de iniciar sesión", () => {
    const fetchMock = vi.fn();
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("inicia sesión y lista las partidas autorizadas", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { accessToken: "token-demo", user }))
      .mockResolvedValueOnce(json(200, [summary]));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    await signIn(fetchMock);

    expect(await screen.findByText("PL-HRAG")).toBeInTheDocument();
    expect(screen.getByText("Docente")).toBeInTheDocument();
    expect(sessionStorage.getItem("verix.external.accessToken")).toBe("token-demo");
    expect(JSON.stringify(sessionStorage)).not.toContain("clave-de-prueba");
    expect(fetchMock.mock.calls[0][0]).toBe("http://localhost:3001/api/auth/login");
    expect(fetchMock.mock.calls[1][0]).toBe("http://localhost:3002/api/sessions");
    expect(fetchMock.mock.calls[1][1].headers.Authorization).toBe("Bearer token-demo");
  });

  it("consulta una partida por código", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { accessToken: "token-demo", user }))
      .mockResolvedValueOnce(json(200, [summary]))
      .mockResolvedValueOnce(json(200, detail));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    await signIn(fetchMock);

    fireEvent.change(screen.getByLabelText("Código de sala"), { target: { value: " pl-hrag " } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));

    expect((await screen.findAllByText("1. Ana Demo · 1")).length).toBeGreaterThan(0);
    expect(fetchMock.mock.calls[2][0]).toBe("http://localhost:3002/api/sessions/PL-HRAG");
  });

  it("rechaza un token inválido y vuelve al ingreso", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { accessToken: "token-viejo", user }))
      .mockResolvedValueOnce(json(401, { message: "Unauthorized" }));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();

    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "docente@example.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("La sesión no es válida.");
    expect(await screen.findByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(sessionStorage.getItem("verix.external.accessToken")).toBeNull();
  });

  it("informa permiso denegado y una sesión inexistente sin mostrar datos", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { accessToken: "token-demo", user }))
      .mockResolvedValueOnce(json(200, []))
      .mockResolvedValueOnce(json(403, { message: "Prohibido" }))
      .mockResolvedValueOnce(json(404, { message: "Sesión no encontrada.", displayName: "Ana Demo" }));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    await signIn(fetchMock);

    fireEvent.change(screen.getByLabelText("Código de sala"), { target: { value: "PL-AJENA" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("No tienes permiso para consultar este resultado.");
    expect(screen.queryByText("Ana Demo")).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText("Código de sala"), { target: { value: "PL-NONE" } });
    fireEvent.click(screen.getByRole("button", { name: "Consultar" }));
    expect(await screen.findByRole("alert")).toHaveTextContent("Sesión no encontrada.");
    expect(screen.queryByText("Ana Demo")).not.toBeInTheDocument();
  });

  it("explica un fallo de conexión", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    renderPage();
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "docente@example.com" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-de-prueba" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("No se pudo conectar con la API.");
    expect(sessionStorage.getItem("verix.external.accessToken")).toBeNull();
  });

  it("cierra la sesión y deja de mostrar resultados", async () => {
    const fetchMock = vi.fn()
      .mockResolvedValueOnce(json(200, { accessToken: "token-demo", user }))
      .mockResolvedValueOnce(json(200, [summary]));
    vi.stubGlobal("fetch", fetchMock);
    renderPage();
    await signIn(fetchMock);
    expect(await screen.findByText("PL-HRAG")).toBeInTheDocument();

    fireEvent.click(screen.getByRole("button", { name: "Cerrar sesión" }));

    expect(screen.getByRole("button", { name: "Entrar" })).toBeInTheDocument();
    expect(screen.queryByText("PL-HRAG")).not.toBeInTheDocument();
    expect(sessionStorage.getItem("verix.external.accessToken")).toBeNull();
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});

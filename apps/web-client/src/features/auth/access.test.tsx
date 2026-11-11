import { UserRole } from "@profelink/shared-dtos";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../app/router";
import { saveToken } from "../../shared/session";
import { AuthProvider } from "./auth-context";

function unsignedToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.firma`;
}

function renderAt(path: string) {
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[path]} future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("rutas de acceso", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
  });

  it("envía al ingreso cuando no hay sesión", () => {
    renderAt("/profesor");
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
  });

  it("mantiene al profesor en su panel y saca al estudiante del panel docente", () => {
    saveToken(
      unsignedToken({
        sub: "11111111-1111-1111-1111-111111111111",
        email: "profe@profelink.cr",
        displayName: "Profesor Demo",
        role: UserRole.HOST,
        aud: "profelink-game-api",
      }),
    );
    renderAt("/estudiante");
    expect(screen.getByRole("heading", { name: "Mesa de control" })).toBeInTheDocument();
  });

  it("abre el panel del estudiante y cierra la sesión", () => {
    saveToken(
      unsignedToken({
        sub: "22222222-2222-2222-2222-222222222222",
        email: "alumno@profelink.cr",
        displayName: "Ana Demo",
        role: UserRole.PARTICIPANT,
        aud: "profelink-game-api",
      }),
    );
    renderAt("/profesor");
    expect(screen.getByRole("heading", { name: "Listo para entrar" })).toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Salir" }));
    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(sessionStorage.getItem("verix.accessToken")).toBeNull();
  });

  it("muestra el error de credenciales sin escribir la contraseña en consola", async () => {
    const log = vi.spyOn(console, "log").mockImplementation(() => undefined);
    const debug = vi.spyOn(console, "debug").mockImplementation(() => undefined);
    vi.stubGlobal(
      "fetch",
      vi.fn().mockResolvedValue({
        ok: false,
        status: 401,
        text: async () => JSON.stringify({ message: "Credenciales inválidas.", statusCode: 401 }),
      }),
    );
    renderAt("/ingresar");
    fireEvent.change(screen.getByLabelText("Correo"), { target: { value: "profe@profelink.cr" } });
    fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "clave-incorrecta" } });
    fireEvent.click(screen.getByRole("button", { name: "Entrar" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Correo o contraseña incorrectos.");
    expect(log).not.toHaveBeenCalled();
    expect(debug).not.toHaveBeenCalled();
    expect(screen.getByRole("alert").textContent).not.toContain("clave-incorrecta");
  });
});

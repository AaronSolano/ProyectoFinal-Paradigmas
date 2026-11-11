import { UserRole } from "@profelink/shared-dtos";
import { render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../app/router";
import { saveToken } from "../../shared/session";
import { AuthProvider } from "../auth/auth-context";

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

describe("tarjetas del profesor", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("muestra Crea tu reto y Explora retos solo al profesor", () => {
    saveToken(
      unsignedToken({
        sub: "11111111-1111-1111-1111-111111111111",
        email: "profe@profelink.cr",
        displayName: "Profesor Demo",
        role: UserRole.HOST,
        aud: "profelink-game-api",
      }),
    );

    renderAt("/profesor");

    expect(screen.getByRole("link", { name: /Crea tu reto/ })).toHaveAttribute("href", "/profesor/crear");
    expect(screen.getByRole("link", { name: /Explora retos/ })).toHaveAttribute("href", "/profesor/explora");
    expect(screen.getByRole("link", { name: /Iniciar partida/ })).toHaveAttribute("href", "/profesor/iniciar");
  });

  it("no muestra las tarjetas en el panel del estudiante", () => {
    saveToken(
      unsignedToken({
        sub: "22222222-2222-2222-2222-222222222222",
        email: "alumno@profelink.cr",
        displayName: "Ana Demo",
        role: UserRole.PARTICIPANT,
        aud: "profelink-game-api",
      }),
    );

    renderAt("/estudiante");

    expect(screen.getByRole("heading", { name: "Listo para entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Crea tu reto/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Explora retos/ })).not.toBeInTheDocument();
    expect(screen.queryByRole("link", { name: /Iniciar partida/ })).not.toBeInTheDocument();
  });

  it("devuelve al estudiante que intenta abrir Explora retos", () => {
    saveToken(
      unsignedToken({
        sub: "22222222-2222-2222-2222-222222222222",
        email: "alumno@profelink.cr",
        displayName: "Ana Demo",
        role: UserRole.PARTICIPANT,
        aud: "profelink-game-api",
      }),
    );

    renderAt("/profesor/explora");

    expect(screen.getByRole("heading", { name: "Listo para entrar" })).toBeInTheDocument();
    expect(screen.queryByRole("heading", { name: "Explora retos" })).not.toBeInTheDocument();
  });

  it("no presenta ProfeLink como nombre visible", () => {
    saveToken(
      unsignedToken({
        sub: "11111111-1111-1111-1111-111111111111",
        email: "profe@profelink.cr",
        displayName: "Profesor ProfeLink",
        role: UserRole.HOST,
        aud: "profelink-game-api",
      }),
    );

    renderAt("/profesor");

    expect(screen.getByRole("heading", { name: "VeriX" })).toBeInTheDocument();
    expect(screen.queryByText(/ProfeLink/)).not.toBeInTheDocument();
  });
});

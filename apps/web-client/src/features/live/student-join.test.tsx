import { UserRole } from "@profelink/shared-dtos";
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../app/router";
import { saveToken } from "../../shared/session";
import { AuthProvider } from "../auth/auth-context";

function unsignedToken(role: UserRole, name: string): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return unsignedParts(encode, role, name);
}

function unsignedParts(encode: (value: unknown) => string, role: UserRole, name: string): string {
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: "22222222-2222-2222-2222-222222222222",
    email: "alumno@profelink.cr",
    displayName: name,
    role,
    aud: "profelink-game-api",
  })}.firma`;
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

describe("ingreso del estudiante", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("guarda la invitación y pide sesión antes de conectar", () => {
    renderAt("/estudiante/sala/pl-ab12");

    expect(screen.getByLabelText("Correo")).toBeInTheDocument();
    expect(sessionStorage.getItem("verix.returnPath")).toBe("/estudiante/sala/PL-AB12");
    expect(screen.queryByText("Esperando a que el profesor inicie el reto.")).not.toBeInTheDocument();
  });

  it("muestra el código y el nombre sin anunciar el ingreso antes de confirmar", () => {
    saveToken(unsignedToken(UserRole.PARTICIPANT, "Alumno ProfeLink"));
    renderAt("/estudiante/sala/pl-ab12");

    expect(screen.getByText("PL-AB12")).toBeInTheDocument();
    expect(screen.getByText("Participante")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unirme al reto" })).toBeInTheDocument();
    expect(screen.queryByText("Esperando a que el profesor inicie el reto.")).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: "Iniciar juego" })).not.toBeInTheDocument();
    expect(screen.queryByText(/ProfeLink/)).not.toBeInTheDocument();
  });

  it("normaliza el código escrito en el panel", () => {
    saveToken(unsignedToken(UserRole.PARTICIPANT, "Ana Demo"));
    renderAt("/estudiante");

    fireEvent.change(screen.getByLabelText("Código de sala"), { target: { value: " pl-zz99 " } });
    fireEvent.click(screen.getByRole("button", { name: "Continuar" }));

    expect(screen.getByText("PL-ZZ99")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "Unirme al reto" })).toBeInTheDocument();
  });
});

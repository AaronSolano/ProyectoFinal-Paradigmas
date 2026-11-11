import { UserRole } from "@profelink/shared-dtos";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../app/router";
import { HttpError } from "../../shared/http";
import { saveToken } from "../../shared/session";
import { AuthProvider } from "../auth/auth-context";
import * as api from "./quiz-api";

vi.mock("./quiz-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./quiz-api")>()),
  listLibraryQuizzes: vi.fn(),
  getLibraryQuiz: vi.fn(),
  copyLibraryQuiz: vi.fn(),
}));

function unsignedToken(role: UserRole): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: "11111111-1111-1111-1111-111111111111",
    email: "profe@profelink.cr",
    displayName: "Profesor Demo",
    role,
    aud: "profelink-game-api",
  })}.firma`;
}

function renderLibrary() {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={["/profesor/biblioteca"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

const summary = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownerId: "99999999-9999-4999-8999-999999999999",
  title: "Repaso de historia",
  description: null,
  category: "cultura-general" as const,
  published: true,
  questionCount: 2,
};

const detail = {
  ...summary,
  questions: [
    {
      id: "q1",
      quizId: summary.id,
      statement: "Costa Rica abolió su ejército en 1948.",
      imageUrl: null,
      correctAnswer: true,
      timeLimitSeconds: 20,
      sortOrder: 0,
    },
  ],
};

describe("biblioteca de cuestionarios", () => {
  beforeEach(() => {
    sessionStorage.clear();
    vi.mocked(api.listLibraryQuizzes).mockReset();
    vi.mocked(api.getLibraryQuiz).mockReset();
    vi.mocked(api.copyLibraryQuiz).mockReset();
    vi.mocked(api.listLibraryQuizzes).mockResolvedValue({ items: [summary], page: 1, pageSize: 20, total: 1 });
  });

  it("lista lo publicado y filtra por la categoría con guion", async () => {
    saveToken(unsignedToken(UserRole.HOST));
    renderLibrary();

    expect(await screen.findByText("Repaso de historia")).toBeInTheDocument();
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "cultura-general" } });

    await waitFor(() =>
      expect(api.listLibraryQuizzes).toHaveBeenLastCalledWith(
        expect.any(String),
        "/api/library/quizzes?category=cultura-general&page=1&pageSize=20",
      ),
    );
  });

  it("muestra preguntas con su respuesta correcta en el detalle", async () => {
    saveToken(unsignedToken(UserRole.HOST));
    vi.mocked(api.getLibraryQuiz).mockResolvedValue(detail);
    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: /Repaso de historia/ }));

    expect(await screen.findByText("Costa Rica abolió su ejército en 1948.")).toBeInTheDocument();
    expect(screen.getByText(/Respuesta: Verdadero/)).toBeInTheDocument();
  });

  it("oculta un cuestionario privado: el 404 no revela preguntas", async () => {
    saveToken(unsignedToken(UserRole.HOST));
    vi.mocked(api.getLibraryQuiz).mockRejectedValue(new HttpError(404, "Cuestionario no encontrado."));
    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: /Repaso de historia/ }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Cuestionario no encontrado.");
    expect(screen.queryByText(/Respuesta:/)).not.toBeInTheDocument();
    expect(screen.queryByRole("button", { name: /Copiar a mis cuestionarios/ })).not.toBeInTheDocument();
  });

  it("la copia es un cuestionario nuevo y privado, y el original sigue igual en la lista", async () => {
    saveToken(unsignedToken(UserRole.HOST));
    vi.mocked(api.getLibraryQuiz).mockResolvedValue(detail);
    vi.mocked(api.copyLibraryQuiz).mockResolvedValue({
      ...detail,
      id: "bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb",
      ownerId: "11111111-1111-1111-1111-111111111111",
      published: false,
    });
    renderLibrary();

    fireEvent.click(await screen.findByRole("button", { name: /Repaso de historia/ }));
    fireEvent.click(await screen.findByRole("button", { name: /Copiar a mis cuestionarios/ }));

    expect(await screen.findByRole("status")).toHaveTextContent("Es privado");
    expect(api.copyLibraryQuiz).toHaveBeenCalledWith(expect.any(String), summary.id);
    expect(screen.getByRole("button", { name: /Repaso de historia/ })).toBeInTheDocument();
    expect(api.listLibraryQuizzes).toHaveBeenCalledTimes(1);
  });

  it("el estudiante no entra a la biblioteca", () => {
    saveToken(unsignedToken(UserRole.PARTICIPANT));
    renderLibrary();

    expect(screen.getByRole("heading", { name: "Listo para entrar" })).toBeInTheDocument();
    expect(api.listLibraryQuizzes).not.toHaveBeenCalled();
  });
});

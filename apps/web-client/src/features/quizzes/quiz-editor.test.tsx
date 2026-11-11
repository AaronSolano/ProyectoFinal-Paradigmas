import { UserRole } from "@profelink/shared-dtos";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AppRoutes } from "../../app/router";
import { saveToken } from "../../shared/session";
import { AuthProvider } from "../auth/auth-context";
import * as api from "./quiz-api";

vi.mock("./quiz-api", async (importOriginal) => ({
  ...(await importOriginal<typeof import("./quiz-api")>()),
  listQuizzes: vi.fn(),
  listQuestions: vi.fn(),
  createQuiz: vi.fn(),
  updateQuiz: vi.fn(),
}));

function hostToken(): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode({
    sub: "11111111-1111-1111-1111-111111111111",
    email: "profe@profelink.cr",
    displayName: "Profesor Demo",
    role: UserRole.HOST,
    aud: "profelink-game-api",
  })}.firma`;
}

function renderEditor() {
  return render(
    <AuthProvider>
      <MemoryRouter
        initialEntries={["/profesor/crear"]}
        future={{ v7_startTransition: true, v7_relativeSplatPath: true }}
      >
        <AppRoutes />
      </MemoryRouter>
    </AuthProvider>,
  );
}

const owned = {
  id: "aaaaaaaa-aaaa-4aaa-8aaa-aaaaaaaaaaaa",
  ownerId: "11111111-1111-1111-1111-111111111111",
  title: "Mi cuestionario",
  description: null,
  category: "ciencias" as const,
  published: false,
};

describe("editor del profesor: categoría y publicación", () => {
  beforeEach(() => {
    sessionStorage.clear();
    saveToken(hostToken());
    vi.mocked(api.listQuizzes).mockReset().mockResolvedValue([]);
    vi.mocked(api.listQuestions).mockReset().mockResolvedValue([]);
    vi.mocked(api.createQuiz).mockReset();
    vi.mocked(api.updateQuiz).mockReset();
  });

  it("bloquea la creación sin categoría y no llama al servidor", async () => {
    renderEditor();
    await screen.findByText("Crear cuestionario");

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Repaso" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuestionario" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("Elige una categoría");
    expect(api.createQuiz).not.toHaveBeenCalled();
  });

  it("crea con la categoría elegida y el cuestionario queda privado", async () => {
    vi.mocked(api.createQuiz).mockResolvedValue({ ...owned, category: "cultura-general" });
    renderEditor();
    await screen.findByText("Crear cuestionario");

    fireEvent.change(screen.getByLabelText("Título"), { target: { value: "Repaso" } });
    fireEvent.change(screen.getByLabelText("Categoría"), { target: { value: "cultura-general" } });
    fireEvent.click(screen.getByRole("button", { name: "Crear cuestionario" }));

    await waitFor(() =>
      expect(api.createQuiz).toHaveBeenCalledWith(expect.any(String), {
        title: "Repaso",
        description: undefined,
        category: "cultura-general",
      }),
    );
    expect(await screen.findByTestId("publish-state")).toHaveTextContent("Privado");
  });

  it("no publica un cuestionario sin preguntas", async () => {
    vi.mocked(api.listQuizzes).mockResolvedValue([owned]);
    renderEditor();

    fireEvent.click(await screen.findByRole("button", { name: "Publicar en la biblioteca" }));

    expect(await screen.findByRole("alert")).toHaveTextContent("al menos una pregunta");
    expect(api.updateQuiz).not.toHaveBeenCalled();
  });

  it("publica de forma explícita cuando hay preguntas", async () => {
    vi.mocked(api.listQuizzes).mockResolvedValue([owned]);
    vi.mocked(api.listQuestions).mockResolvedValue([
      {
        id: "q1",
        quizId: owned.id,
        statement: "El agua hierve a 100 °C.",
        imageUrl: null,
        correctAnswer: true,
        timeLimitSeconds: 20,
        sortOrder: 0,
      },
    ]);
    vi.mocked(api.updateQuiz).mockResolvedValue({ ...owned, published: true });
    renderEditor();

    await screen.findByText("El agua hierve a 100 °C.");
    fireEvent.click(screen.getByRole("button", { name: "Publicar en la biblioteca" }));

    await waitFor(() =>
      expect(api.updateQuiz).toHaveBeenCalledWith(expect.any(String), owned.id, {
        category: "ciencias",
        published: true,
      }),
    );
    expect(await screen.findByTestId("publish-state")).toHaveTextContent("Publicado en la biblioteca");
  });
});

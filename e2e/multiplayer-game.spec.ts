import { expect, test, type Browser, type BrowserContext, type Page } from "@playwright/test";

const AUTH_API = process.env.E2E_AUTH_API_URL ?? "http://localhost:3001";
const GAME_API = process.env.E2E_GAME_API_URL ?? "http://localhost:3002";
const HOST_EMAIL = process.env.E2E_HOST_EMAIL ?? "profe@profelink.cr";
const PASSWORD = process.env.E2E_PASSWORD ?? "Profelink123!";

type Player = { context: BrowserContext; page: Page; name: string; email: string };

async function api<T>(url: string, init: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...init,
    headers: { "content-type": "application/json", ...(init.headers ?? {}) },
  });
  if (!response.ok) {
    throw new Error(`${init.method ?? "GET"} ${url} -> ${response.status} ${await response.text()}`);
  }
  return (await response.json()) as T;
}

async function login(page: Page, email: string): Promise<void> {
  await page.goto("/ingresar");
  await page.getByLabel("Correo").fill(email);
  await page.getByLabel(/Contrase.a/).fill(PASSWORD);
  await page.getByRole("button", { name: "Entrar" }).click();
}

async function newPlayer(browser: Browser, name: string, email: string): Promise<Player> {
  // Contexto aislado por participante: cookies, storage y WebSocket independientes.
  const context = await browser.newContext();
  return { context, page: await context.newPage(), name, email };
}

test("multiplayer game: 1 host + 2 students, V/F answers and podium", async ({ browser }) => {
  const stamp = Date.now();
  const alice = `Alice${stamp}`;
  const bob = `Bob${stamp}`;

  // --- Preparacion por API: cuestionario del host y dos estudiantes ---
  const hostAuth = await api<{ accessToken: string }>(`${AUTH_API}/api/auth/login`, {
    method: "POST",
    body: JSON.stringify({ email: HOST_EMAIL, password: PASSWORD }),
  });
  const hostHeaders = { authorization: `Bearer ${hostAuth.accessToken}` };
  const quiz = await api<{ id: string; title: string }>(`${GAME_API}/api/quizzes`, {
    method: "POST",
    headers: hostHeaders,
    body: JSON.stringify({ title: `E2E multijugador ${stamp}` }),
  });
  const questions = [
    { statement: "TypeScript compila a JavaScript", correctAnswer: true },
    { statement: "HTTP es un protocolo con estado por defecto", correctAnswer: false },
  ];
  for (const [sortOrder, q] of questions.entries()) {
    await api(`${GAME_API}/api/quizzes/${quiz.id}/questions`, {
      method: "POST",
      headers: hostHeaders,
      body: JSON.stringify({ ...q, timeLimitSeconds: 30, sortOrder }),
    });
  }
  const students = [
    { name: alice, email: `alice.${stamp}@e2e.profelink.cr` },
    { name: bob, email: `bob.${stamp}@e2e.profelink.cr` },
  ];
  for (const s of students) {
    await api(`${AUTH_API}/api/auth/register`, {
      method: "POST",
      body: JSON.stringify({ email: s.email, password: PASSWORD, displayName: s.name, role: "PARTICIPANT" }),
    });
  }

  const host = await newPlayer(browser, "host", HOST_EMAIL);
  const players = await Promise.all(students.map((s) => newPlayer(browser, s.name, s.email)));
  const [p1, p2] = players;

  try {
    // --- Host: login y creacion de sala ---
    await login(host.page, HOST_EMAIL);
    await host.page.waitForURL(/\/profesor/);
    await host.page.goto("/profesor/iniciar");
    await host.page.getByRole("button", { name: new RegExp(quiz.title) }).click();
    await host.page.getByRole("button", { name: "Crear sala" }).click();
    await host.page.waitForURL(/\/profesor\/sala\/[^/]+/);
    const roomCode = decodeURIComponent(new URL(host.page.url()).pathname.split("/").pop()!);
    await expect(host.page.getByText("WebSocket: Conectado")).toBeVisible();

    // --- Estudiantes: login y union con el PIN, en paralelo ---
    await Promise.all(
      players.map(async (p) => {
        await login(p.page, p.email);
        await p.page.waitForURL(/\/estudiante/);
        await p.page.getByLabel(/C.digo de sala/).fill(roomCode);
        await p.page.getByRole("button", { name: "Continuar" }).click();
        await p.page.getByRole("button", { name: "Unirme al reto" }).click();
        await expect(p.page.getByText("WebSocket: Conectado")).toBeVisible();
        await expect(p.page.getByRole("heading", { name: "Sala de espera" })).toBeVisible();
      }),
    );
    await expect(host.page.getByText("2 jugadores")).toBeVisible();

    // --- Ronda 1 (V): ambos aciertan ---
    await host.page.getByRole("button", { name: "Iniciar juego" }).click();
    await Promise.all(
      players.map(async (p) => {
        await expect(p.page.getByRole("heading", { name: questions[0].statement })).toBeVisible();
        await p.page.getByRole("button", { name: "Verdadero" }).click();
      }),
    );
    await host.page.getByRole("button", { name: "Cerrar pregunta" }).click();
    await Promise.all(players.map((p) => expect(p.page.getByText(/Respuesta correcta: Verdadero/)).toBeVisible()));

    // --- Ronda 2 (F): Alice acierta, Bob falla ---
    await host.page.getByRole("button", { name: "Siguiente pregunta" }).click();
    await Promise.all([
      (async () => {
        await expect(p1.page.getByRole("heading", { name: questions[1].statement })).toBeVisible();
        await p1.page.getByRole("button", { name: "Falso", exact: true }).click();
      })(),
      (async () => {
        await expect(p2.page.getByRole("heading", { name: questions[1].statement })).toBeVisible();
        await p2.page.getByRole("button", { name: "Verdadero" }).click();
      })(),
    ]);
    await host.page.getByRole("button", { name: "Cerrar pregunta" }).click();
    await expect(host.page.getByText(/Respuesta correcta: Falso/)).toBeVisible();

    // --- Fin de partida (el host agota las preguntas y confirma) ---
    await host.page.getByRole("button", { name: "Siguiente pregunta" }).click();
    await host.page.getByRole("button", { name: "Finalizar partida" }).click();
    await host.page.getByRole("button", { name: /Confirmar finalizaci/ }).click();

    // --- Podio coherente en las tres pantallas ---
    for (const p of [host, p1, p2]) {
      await expect(p.page.getByTestId("podium-place").first()).toBeVisible({ timeout: 30_000 });
      await expect(p.page.getByTestId("ranking-row")).toHaveCount(2, { timeout: 30_000 });
    }
    for (const p of [host, p1, p2]) {
      const rows = p.page.getByTestId("ranking-row");
      await expect(rows.nth(0)).toContainText(alice);
      await expect(rows.nth(1)).toContainText(bob);
    }
  } finally {
    await Promise.all([host, ...players].map((p) => p.context.close()));
  }
});

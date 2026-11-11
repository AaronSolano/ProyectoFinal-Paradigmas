import {
  ApiError,
  type LoginResponse,
  type SessionDetail,
  type SessionSummary,
} from "./contracts";
import { loginFailure, readApiConfig, readFailure } from "./consumer-model";

export async function login(email: string, password: string): Promise<LoginResponse> {
  const { authApiUrl } = readApiConfig();
  const body = await requestJson<LoginResponse>(`${authApiUrl}/api/auth/login`, {
    method: "POST",
    body: { email, password },
  }, loginFailure);
  if (!body?.accessToken || !body.user?.id) {
    throw new ApiError(0, "La API de autenticación no devolvió un token.");
  }
  return body;
}

export function listSessions(token: string): Promise<SessionSummary[]> {
  const { gameApiUrl } = readApiConfig();
  return requestJson<SessionSummary[]>(`${gameApiUrl}/api/sessions`, { token }, readFailure);
}

export function findSession(token: string, roomCode: string): Promise<SessionDetail> {
  const { gameApiUrl } = readApiConfig();
  return requestJson<SessionDetail>(
    `${gameApiUrl}/api/sessions/${encodeURIComponent(roomCode)}`,
    { token },
    readFailure,
  );
}

async function requestJson<T>(
  url: string,
  options: { method?: "GET" | "POST"; token?: string; body?: unknown },
  failure: (status: number, serverMessage: string | null) => string,
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    });
  } catch {
    throw new ApiError(0, failure(0, null));
  }

  const text = await response.text();
  const parsed = text ? parseJson(text) : null;
  if (!response.ok) {
    throw new ApiError(response.status, failure(response.status, messageFrom(parsed)));
  }
  return parsed as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageFrom(body: unknown): string | null {
  if (!body || typeof body !== "object" || !("message" in body)) {
    return null;
  }
  const message = (body as { message: unknown }).message;
  if (typeof message === "string" && message.length > 0 && message.length <= 180) {
    return message;
  }
  return null;
}

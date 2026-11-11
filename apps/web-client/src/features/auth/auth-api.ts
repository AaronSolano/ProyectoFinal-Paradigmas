import { readClientEnv } from "../../shared/env";
import { HttpError, requestJson } from "../../shared/http";
import { sessionFromToken, type SessionUser } from "../../shared/session";

type LoginResponse = {
  accessToken?: unknown;
  user?: {
    id?: unknown;
    role?: unknown;
  };
};

export async function loginRequest(email: string, password: string): Promise<{ accessToken: string; user: SessionUser }> {
  const { authApiUrl } = readClientEnv();
  const body = await requestJson<LoginResponse>(`${authApiUrl}/api/auth/login`, {
    method: "POST",
    body: { email, password },
  });

  if (typeof body.accessToken !== "string") {
    throw new HttpError(502, "La respuesta de acceso no es válida.");
  }

  const user = sessionFromToken(body.accessToken);
  if (!user || user.id !== body.user?.id || user.role !== body.user?.role) {
    throw new HttpError(502, "La respuesta de acceso no es válida.");
  }

  return { accessToken: body.accessToken, user };
}

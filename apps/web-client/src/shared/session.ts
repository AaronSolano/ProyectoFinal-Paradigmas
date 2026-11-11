import { UserRole } from "@profelink/shared-dtos";

const TOKEN_KEY = "verix.accessToken";
const EXPECTED_AUDIENCE = "profelink-game-api";

export type SessionUser = {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
};

type JwtClaims = {
  sub?: unknown;
  email?: unknown;
  displayName?: unknown;
  role?: unknown;
  aud?: unknown;
};

export function sessionFromToken(token: string): SessionUser | null {
  const payload = token.split(".")[1];
  if (!payload || token.split(".").length !== 3) {
    return null;
  }

  try {
    const claims = JSON.parse(decodeBase64Url(payload)) as JwtClaims;
    if (!audienceMatches(claims.aud)) {
      return null;
    }
    if (claims.role !== UserRole.HOST && claims.role !== UserRole.PARTICIPANT) {
      return null;
    }
    if (!isText(claims.sub) || !isText(claims.email) || !isText(claims.displayName)) {
      return null;
    }
    return {
      id: claims.sub,
      email: claims.email,
      displayName: claims.displayName,
      role: claims.role,
    };
  } catch {
    return null;
  }
}

export function readStoredToken(): string | null {
  const token = sessionStorage.getItem(TOKEN_KEY);
  if (!token || !sessionFromToken(token)) {
    sessionStorage.removeItem(TOKEN_KEY);
    return null;
  }
  return token;
}

export function readStoredUser(): SessionUser | null {
  const token = readStoredToken();
  return token ? sessionFromToken(token) : null;
}

export function saveToken(token: string): SessionUser {
  const user = sessionFromToken(token);
  if (!user) {
    sessionStorage.removeItem(TOKEN_KEY);
    throw new Error("La sesión recibida no es válida.");
  }
  sessionStorage.setItem(TOKEN_KEY, token);
  return user;
}

export function clearSession(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

function audienceMatches(audience: unknown): boolean {
  if (typeof audience === "string") {
    return audience === EXPECTED_AUDIENCE;
  }
  return Array.isArray(audience) && audience.includes(EXPECTED_AUDIENCE);
}

function isText(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/") + "=".repeat((4 - (value.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = Uint8Array.from(binary, (char) => char.charCodeAt(0));
  return new TextDecoder().decode(bytes);
}

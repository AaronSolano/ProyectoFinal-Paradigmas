const TOKEN_KEY = "verix.external.accessToken";

export function readToken(): string | null {
  return sessionStorage.getItem(TOKEN_KEY);
}

export function saveToken(token: string): void {
  sessionStorage.setItem(TOKEN_KEY, token);
}

export function clearToken(): void {
  sessionStorage.removeItem(TOKEN_KEY);
}

export function hasSession(): boolean {
  return Boolean(readToken());
}

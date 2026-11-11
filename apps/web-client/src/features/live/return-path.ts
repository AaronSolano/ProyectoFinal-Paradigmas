const RETURN_KEY = "verix.returnPath";

export function rememberReturnPath(path: string): void {
  sessionStorage.setItem(RETURN_KEY, path);
}

export function consumeReturnPath(): string | null {
  const value = sessionStorage.getItem(RETURN_KEY);
  sessionStorage.removeItem(RETURN_KEY);
  return value;
}

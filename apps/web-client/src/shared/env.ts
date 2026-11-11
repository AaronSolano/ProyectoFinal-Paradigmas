export type EnvSource = {
  VITE_AUTH_API_URL?: string;
  VITE_GAME_API_URL?: string;
  VITE_GAME_WS_URL?: string;
};

export type ClientEnv = {
  authApiUrl: string;
  gameApiUrl: string;
  gameWsUrl: string;
};

export function readClientEnv(source: EnvSource = import.meta.env): ClientEnv {
  return {
    authApiUrl: requirePublicUrl(source.VITE_AUTH_API_URL, "VITE_AUTH_API_URL"),
    gameApiUrl: requirePublicUrl(source.VITE_GAME_API_URL, "VITE_GAME_API_URL"),
    gameWsUrl: requirePublicUrl(source.VITE_GAME_WS_URL, "VITE_GAME_WS_URL"),
  };
}

function requirePublicUrl(value: string | undefined, name: string): string {
  const trimmed = value?.trim() ?? "";
  if (!trimmed) {
    throw new Error(`Falta ${name}.`);
  }

  let url: URL;
  try {
    url = new URL(trimmed);
  } catch {
    throw new Error(`${name} no es una URL válida.`);
  }

  if (url.protocol !== "http:" && url.protocol !== "https:") {
    throw new Error(`${name} debe usar HTTP o HTTPS.`);
  }
  if (url.username || url.password) {
    throw new Error(`${name} no debe incluir credenciales.`);
  }

  return trimmed.replace(/\/$/, "");
}

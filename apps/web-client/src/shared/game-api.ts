import { readClientEnv } from "./env";
import { requestJson, type RequestOptions } from "./http";

export function gameRequest<T>(
  path: string,
  token: string,
  options: Omit<RequestOptions, "token"> = {},
): Promise<T> {
  const { gameApiUrl } = readClientEnv();
  return requestJson<T>(`${gameApiUrl}${path}`, { ...options, token });
}

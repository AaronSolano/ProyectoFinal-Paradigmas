import { ApiError } from "./contracts";

export function readApiConfig(): { authApiUrl: string; gameApiUrl: string } {
  const authApiUrl = import.meta.env.VITE_AUTH_API_URL?.replace(/\/$/, "") ?? "";
  const gameApiUrl = import.meta.env.VITE_GAME_API_URL?.replace(/\/$/, "") ?? "";
  if (!authApiUrl || !gameApiUrl) {
    throw new ApiError(0, "Faltan las direcciones de las APIs.");
  }
  return { authApiUrl, gameApiUrl };
}

export function normalizeRoomCode(value: string): string {
  return value.trim().toUpperCase();
}

export function loginFailure(status: number, serverMessage: string | null): string {
  if (status === 0) {
    return "No se pudo conectar con la API.";
  }
  if (status === 401) {
    return "Correo o contraseña incorrectos.";
  }
  return serverMessage || "No se pudo iniciar sesión.";
}

export function readFailure(status: number, serverMessage: string | null): string {
  if (status === 0) {
    return "No se pudo conectar con la API.";
  }
  if (status === 401) {
    return "La sesión no es válida.";
  }
  if (status === 403) {
    return "No tienes permiso para consultar este resultado.";
  }
  if (status === 404) {
    return "Sesión no encontrada.";
  }
  return serverMessage || "La API rechazó la consulta.";
}

export function formatFinishedAt(iso: string): string {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return iso;
  }
  return new Intl.DateTimeFormat("es-CR", { dateStyle: "medium", timeStyle: "short" }).format(date);
}

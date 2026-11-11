const TIME_LIMIT_MESSAGE = "El tiempo debe ser un entero entre 5 y 120 segundos.";

export function questionTimeLimitError(value: string): string | null {
  const seconds = Number(value);
  if (!Number.isInteger(seconds) || seconds < 5 || seconds > 120) {
    return TIME_LIMIT_MESSAGE;
  }
  return null;
}

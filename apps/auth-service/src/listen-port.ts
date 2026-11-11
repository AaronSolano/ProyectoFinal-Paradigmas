export function resolveListenPort(
  platformPort: string | undefined,
  servicePort: string | number | undefined,
  fallback: number,
): number {
  const preferred = platformPort?.trim() ? platformPort.trim() : String(servicePort ?? "").trim();
  const parsed = Number(preferred);
  if (!Number.isInteger(parsed) || parsed < 1 || parsed > 65535) {
    return fallback;
  }
  return parsed;
}

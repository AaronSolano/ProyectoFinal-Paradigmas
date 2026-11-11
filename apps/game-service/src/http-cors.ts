import type { INestApplication } from "@nestjs/common";

/** Orígenes del cliente React y del consumidor externo. Nunca un comodín. */
export const BROWSER_WEB_ORIGINS = [
  "http://localhost:5173",
  "http://localhost:5174",
] as const;

/** Local origins plus exact entries from CORS_ORIGINS. A wildcard is ignored. */
export function browserWebOrigins(rawExtra: string | undefined = process.env.CORS_ORIGINS): string[] {
  const extras = (rawExtra ?? "")
    .split(",")
    .map((item) => item.trim())
    .filter((item) => item.length > 0 && item !== "*");
  return [...new Set<string>([...BROWSER_WEB_ORIGINS, ...extras])];
}

export function enableBrowserCors(app: INestApplication): void {
  app.enableCors({
    origin: browserWebOrigins(),
    methods: ["GET", "POST", "PATCH", "DELETE"],
    allowedHeaders: ["Authorization", "Content-Type"],
    optionsSuccessStatus: 204,
  });
}

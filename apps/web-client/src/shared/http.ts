export class HttpError extends Error {
  readonly status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = "HttpError";
    this.status = status;
  }
}

export type RequestOptions = {
  method?: "GET" | "POST" | "PATCH" | "DELETE";
  token?: string;
  body?: unknown;
};

export async function requestJson<T>(url: string, options: RequestOptions = {}): Promise<T> {
  return readResponse<T>(
    fetch(url, {
      method: options.method ?? "GET",
      headers: {
        Accept: "application/json",
        ...(options.body === undefined ? {} : { "Content-Type": "application/json" }),
        ...(options.token ? { Authorization: `Bearer ${options.token}` } : {}),
      },
      body: options.body === undefined ? undefined : JSON.stringify(options.body),
    }),
  );
}

export async function requestForm<T>(url: string, token: string, body: FormData): Promise<T> {
  return readResponse<T>(
    fetch(url, {
      method: "POST",
      headers: {
        Accept: "application/json",
        Authorization: `Bearer ${token}`,
      },
      body,
    }),
  );
}

async function readResponse<T>(pending: Promise<Response>): Promise<T> {
  let response: Response;
  try {
    response = await pending;
  } catch {
    throw new HttpError(0, "No se pudo conectar con el servicio.");
  }

  const text = await response.text();
  const parsed = text ? parseJson(text) : null;
  if (!response.ok) {
    throw new HttpError(response.status, messageFromBody(parsed, response.status));
  }
  return parsed as T;
}

function parseJson(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return null;
  }
}

function messageFromBody(body: unknown, status: number): string {
  if (status === 401) {
    return "Correo o contraseña incorrectos.";
  }

  if (body && typeof body === "object" && "message" in body) {
    const message = (body as { message: unknown }).message;
    if (typeof message === "string" && isSafeMessage(message)) {
      return message;
    }
    if (Array.isArray(message)) {
      const first = message.find((item) => typeof item === "string" && isSafeMessage(item));
      if (typeof first === "string") {
        return first;
      }
    }
  }

  return "La solicitud no se pudo completar.";
}

function isSafeMessage(message: string): boolean {
  return message.length > 0 && message.length <= 180 && !message.includes("eyJ") && !message.includes("Bearer ");
}

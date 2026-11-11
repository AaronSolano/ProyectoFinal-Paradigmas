import { UserRole } from "@profelink/shared-dtos";
import { clearSession, readStoredUser, saveToken, sessionFromToken } from "./session";

function unsignedToken(payload: Record<string, unknown>): string {
  const encode = (value: unknown) =>
    btoa(JSON.stringify(value)).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
  return `${encode({ alg: "none", typ: "JWT" })}.${encode(payload)}.firma`;
}

const hostPayload = {
  sub: "11111111-1111-1111-1111-111111111111",
  email: "profe@profelink.cr",
  displayName: "Profesor Demo",
  role: UserRole.HOST,
  aud: "profelink-game-api",
};

describe("session", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("acepta un token de anfitrión con la audiencia del juego", () => {
    expect(sessionFromToken(unsignedToken(hostPayload))?.role).toBe(UserRole.HOST);
  });

  it("rechaza otra audiencia y un token mal formado", () => {
    expect(sessionFromToken(unsignedToken({ ...hostPayload, aud: "otro-servicio" }))).toBeNull();
    expect(sessionFromToken("no-es-jwt")).toBeNull();
  });

  it("guarda y elimina la sesión sin dejar un token inválido", () => {
    const user = saveToken(unsignedToken(hostPayload));
    expect(user.displayName).toBe("Profesor Demo");
    expect(readStoredUser()?.id).toBe(hostPayload.sub);
    clearSession();
    expect(readStoredUser()).toBeNull();
  });
});

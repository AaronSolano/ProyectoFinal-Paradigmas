import { loginFailure, normalizeRoomCode, readFailure } from "./consumer-model";
import { clearToken, hasSession, readToken, saveToken } from "./session";

describe("sesión del consumidor", () => {
  beforeEach(() => {
    sessionStorage.clear();
  });

  it("guarda solo el token y lo elimina al cerrar sesión", () => {
    expect(hasSession()).toBe(false);
    saveToken("token-demo");
    expect(readToken()).toBe("token-demo");
    expect(sessionStorage.getItem("verix.external.accessToken")).toBe("token-demo");
    clearToken();
    expect(hasSession()).toBe(false);
  });

  it("describe los fallos de autenticación y de consulta", () => {
    expect(loginFailure(401, "Credenciales inválidas.")).toBe("Correo o contraseña incorrectos.");
    expect(loginFailure(0, null)).toBe("No se pudo conectar con la API.");
    expect(readFailure(401, "Unauthorized")).toBe("La sesión no es válida.");
    expect(readFailure(403, null)).toBe("No tienes permiso para consultar este resultado.");
    expect(readFailure(404, "Sesión no encontrada.")).toBe("Sesión no encontrada.");
    expect(readFailure(0, null)).toBe("No se pudo conectar con la API.");
    expect(normalizeRoomCode(" pl-hrag ")).toBe("PL-HRAG");
  });
});

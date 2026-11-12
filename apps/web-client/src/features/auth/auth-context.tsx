import { createContext, useContext, useMemo, useState, type ReactNode } from "react";
import { loginRequest, registerRequest, type RegisterInput } from "./auth-api";
import { clearSession, readStoredUser, saveToken, type SessionUser } from "../../shared/session";

type AuthContextValue = {
  user: SessionUser | null;
  login: (email: string, password: string) => Promise<SessionUser>;
  register: (input: RegisterInput) => Promise<SessionUser>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SessionUser | null>(() => readStoredUser());

  const value = useMemo<AuthContextValue>(() => {
    async function login(email: string, password: string) {
      const result = await loginRequest(email, password);
      const nextUser = saveToken(result.accessToken);
      setUser(nextUser);
      return nextUser;
    }

    return {
      user,
      login,
      async register(input: RegisterInput) {
        await registerRequest(input);
        return login(input.email, input.password);
      },
      logout() {
        clearSession();
        setUser(null);
      },
    };
  }, [user]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("La sesión de VeriX no está disponible.");
  }
  return value;
}

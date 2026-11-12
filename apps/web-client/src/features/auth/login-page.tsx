import { UserRole } from "@profelink/shared-dtos";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HttpError } from "../../shared/http";
import { consumeReturnPath } from "../live/return-path";
import { homePathForRole, paths } from "../../shared/paths";
import { VerixMark } from "../../shared/verix-mark";
import { useAuth } from "./auth-context";

export function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setPending(true);
    try {
      const signedIn = await login(email.trim(), password);
      const pendingPath = consumeReturnPath();
      const canReturn = signedIn.role === UserRole.PARTICIPANT && pendingPath?.startsWith("/estudiante/");
      navigate(canReturn && pendingPath ? pendingPath : homePathForRole(signedIn.role), { replace: true });
    } catch (caught) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo iniciar sesión.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-vx-cyan/30 bg-panel/90 p-6 shadow-neon sm:p-8">
        <VerixMark />
        <p className="mt-3 text-lg text-white/80">Cuestionarios de verdadero o falso, en vivo.</p>
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <label className="block text-sm font-medium text-vx-cyan" htmlFor="email">
            Correo
            <input
              id="email"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-4 text-base text-white"
              type="email"
              autoComplete="username"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              disabled={pending}
            />
          </label>
          <label className="block text-sm font-medium text-vx-magenta" htmlFor="password">
            Contraseña
            <input
              id="password"
              className="mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-4 text-base text-white"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              disabled={pending}
            />
          </label>
          {error ? (
            <p className="rounded-2xl border border-vx-magenta/50 bg-vx-magenta/10 px-4 py-3 text-sm" role="alert">
              {error}
            </p>
          ) : null}
          <button
            className="w-full rounded-2xl bg-gradient-to-r from-vx-cyan to-vx-magenta px-4 py-4 text-lg font-bold text-ink hover:brightness-110 disabled:opacity-60"
            type="submit"
            disabled={pending}
          >
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          ¿No tienes cuenta?{" "}
          <Link className="font-semibold text-vx-cyan hover:underline" to={paths.register}>
            Crear cuenta
          </Link>
        </p>
      </section>
    </main>
  );
}

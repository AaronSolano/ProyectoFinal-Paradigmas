import { UserRole } from "@profelink/shared-dtos";
import { useState, type FormEvent } from "react";
import { Link, useNavigate } from "react-router-dom";
import { HttpError } from "../../shared/http";
import { homePathForRole, paths } from "../../shared/paths";
import { VerixMark } from "../../shared/verix-mark";
import { consumeReturnPath } from "../live/return-path";
import { useAuth } from "./auth-context";

const MIN_PASSWORD = 8;
const MIN_NAME = 2;

const inputClass = "mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-4 text-base text-white";

const roleOptions = [
  { value: UserRole.HOST, label: "Profesor", hint: "Crea cuestionarios y dirige partidas." },
  { value: UserRole.PARTICIPANT, label: "Estudiante", hint: "Se une a partidas con un código." },
] as const;

export function RegisterPage() {
  const { register } = useAuth();
  const navigate = useNavigate();
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [role, setRole] = useState<UserRole>(UserRole.PARTICIPANT);
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);

    const name = displayName.trim();
    if (name.length < MIN_NAME) {
      setError(`El nombre debe tener al menos ${MIN_NAME} caracteres.`);
      return;
    }
    if (password.length < MIN_PASSWORD) {
      setError(`La contraseña debe tener al menos ${MIN_PASSWORD} caracteres.`);
      return;
    }
    if (password !== confirm) {
      setError("Las contraseñas no coinciden.");
      return;
    }

    setPending(true);
    try {
      const signedIn = await register({ email: email.trim(), password, displayName: name, role });
      const pendingPath = consumeReturnPath();
      const canReturn = signedIn.role === UserRole.PARTICIPANT && pendingPath?.startsWith("/estudiante/");
      navigate(canReturn && pendingPath ? pendingPath : homePathForRole(signedIn.role), { replace: true });
    } catch (caught) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo crear la cuenta.");
    } finally {
      setPending(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-md items-center px-4 py-10">
      <section className="w-full rounded-3xl border border-vx-cyan/30 bg-panel/90 p-6 shadow-neon sm:p-8">
        <VerixMark />
        <p className="mt-3 text-lg text-white/80">Crea tu cuenta para jugar o dirigir partidas.</p>
        <form className="mt-8 space-y-5" onSubmit={onSubmit}>
          <fieldset className="space-y-2" disabled={pending}>
            <legend className="text-sm font-medium text-white/80">Tipo de cuenta</legend>
            <div className="grid grid-cols-2 gap-3">
              {roleOptions.map((option) => {
                const selected = role === option.value;
                return (
                  <label
                    key={option.value}
                    className={`cursor-pointer rounded-2xl border px-4 py-3 text-left transition ${
                      selected ? "border-vx-cyan bg-vx-cyan/10 text-white" : "border-white/15 bg-ink text-white/70 hover:border-white/30"
                    }`}
                  >
                    <input
                      className="sr-only"
                      type="radio"
                      name="role"
                      value={option.value}
                      checked={selected}
                      onChange={() => setRole(option.value)}
                    />
                    <span className="block font-bold">{option.label}</span>
                    <span className="mt-1 block text-xs text-white/60">{option.hint}</span>
                  </label>
                );
              })}
            </div>
          </fieldset>
          <label className="block text-sm font-medium text-vx-cyan" htmlFor="displayName">
            Nombre
            <input
              id="displayName"
              className={inputClass}
              type="text"
              autoComplete="name"
              value={displayName}
              onChange={(event) => setDisplayName(event.target.value)}
              minLength={MIN_NAME}
              required
              disabled={pending}
            />
          </label>
          <label className="block text-sm font-medium text-vx-cyan" htmlFor="email">
            Correo
            <input
              id="email"
              className={inputClass}
              type="email"
              autoComplete="email"
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
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              minLength={MIN_PASSWORD}
              required
              disabled={pending}
            />
          </label>
          <label className="block text-sm font-medium text-vx-magenta" htmlFor="confirm">
            Repite la contraseña
            <input
              id="confirm"
              className={inputClass}
              type="password"
              autoComplete="new-password"
              value={confirm}
              onChange={(event) => setConfirm(event.target.value)}
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
            {pending ? "Creando cuenta…" : "Crear cuenta"}
          </button>
        </form>
        <p className="mt-6 text-center text-sm text-white/70">
          ¿Ya tienes cuenta?{" "}
          <Link className="font-semibold text-vx-cyan hover:underline" to={paths.login}>
            Inicia sesión
          </Link>
        </p>
      </section>
    </main>
  );
}

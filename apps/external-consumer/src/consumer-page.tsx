import { FormEvent, useEffect, useState } from "react";
import { findSession, listSessions, login } from "./api";
import { ApiError, type ApiUser, type SessionDetail, type SessionSummary } from "./contracts";
import { formatFinishedAt, normalizeRoomCode } from "./consumer-model";
import { clearToken, readToken, saveToken } from "./session";

export function ConsumerPage() {
  const [token, setToken] = useState<string | null>(() => readToken());
  const [user, setUser] = useState<ApiUser | null>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);
  const [roomCode, setRoomCode] = useState("");
  const [detail, setDetail] = useState<SessionDetail | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => {
    if (!token) {
      setPending(false);
      return;
    }
    let cancelled = false;
    setPending(true);
    listSessions(token)
      .then((rows) => {
        if (!cancelled) {
          setSessions(rows);
          setNotice(null);
        }
      })
      .catch((error: unknown) => {
        if (!cancelled) {
          applyReadError(error, setToken, setSessions, setDetail, setUser, setNotice);
        }
      })
      .finally(() => {
        if (!cancelled) {
          setPending(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  async function onLogin(event: FormEvent) {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      const result = await login(email.trim(), password);
      saveToken(result.accessToken);
      setPassword("");
      setUser(result.user);
      setToken(result.accessToken);
    } catch (error: unknown) {
      setNotice(error instanceof ApiError ? error.message : "No se pudo iniciar sesión.");
    } finally {
      setPending(false);
    }
  }

  async function onLookup(event: FormEvent) {
    event.preventDefault();
    const code = normalizeRoomCode(roomCode);
    if (!token || !code) {
      setNotice("Escribe el código de la sala.");
      setDetail(null);
      return;
    }
    setPending(true);
    setNotice(null);
    setDetail(null);
    try {
      setDetail(await findSession(token, code));
    } catch (error: unknown) {
      applyReadError(error, setToken, setSessions, setDetail, setUser, setNotice);
    } finally {
      setPending(false);
    }
  }

  function onLogout() {
    clearToken();
    setToken(null);
    setUser(null);
    setSessions(null);
    setDetail(null);
    setRoomCode("");
    setPassword("");
    setNotice(null);
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl flex-col px-4 py-8">
      <header className="rounded-3xl border border-dashed border-vx-cyan/50 bg-panel p-6">
        <p className="text-sm font-medium uppercase tracking-[0.22em] text-vx-cyan">Consumidor externo · HTTP · 5174</p>
        <h1 className="mt-2 text-4xl font-bold">VeriX</h1>
        <p className="mt-3 max-w-xl text-white/75">
          Esta aplicación consulta la API de resultados. No abre el juego ni la base de datos.
        </p>
      </header>

      {notice ? (
        <p className="mt-4 rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
          {notice}
        </p>
      ) : null}

      {!token ? (
        <form className="mt-6 grid gap-4 rounded-3xl border border-white/10 bg-panel p-6" onSubmit={onLogin}>
          <label className="grid gap-2 text-sm text-vx-cyan" htmlFor="email">
            Correo
            <input
              id="email"
              className="rounded-2xl border border-white/15 bg-ink px-4 py-3 text-base text-white"
              autoComplete="username"
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
            />
          </label>
          <label className="grid gap-2 text-sm text-vx-cyan" htmlFor="password">
            Contraseña
            <input
              id="password"
              className="rounded-2xl border border-white/15 bg-ink px-4 py-3 text-base text-white"
              autoComplete="current-password"
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          </label>
          <button className="rounded-2xl bg-vx-cyan px-4 py-3 font-semibold text-ink disabled:opacity-50" disabled={pending} type="submit">
            {pending ? "Entrando…" : "Entrar"}
          </button>
        </form>
      ) : (
        <section className="mt-6 grid gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <p className="text-white/80">{user ? user.displayName : "Sesión activa"}</p>
            <button className="rounded-2xl border border-white/20 px-4 py-2" type="button" onClick={onLogout}>
              Cerrar sesión
            </button>
          </div>
          <article className="rounded-3xl border border-white/10 bg-panel p-6">
            <h2 className="text-xl font-semibold">Partidas autorizadas</h2>
            {pending && !sessions ? <p role="status">Consultando la API…</p> : null}
            {sessions && sessions.length === 0 ? <p className="mt-3">No hay partidas finalizadas para esta cuenta.</p> : null}
            {sessions && sessions.length > 0 ? (
              <ul className="mt-4 grid gap-3">
                {sessions.map((session) => (
                  <li className="rounded-2xl border border-white/10 px-4 py-3" key={session.roomCode}>
                    <p className="font-semibold tracking-[0.12em] text-vx-cyan">{session.roomCode}</p>
                    <p className="text-sm text-white/70">{formatFinishedAt(session.finishedAt)}</p>
                    <p className="text-sm text-white/70">
                      {session.participants.length === 1
                        ? "1 participante"
                        : `${session.participants.length} participantes`}
                    </p>
                  </li>
                ))}
              </ul>
            ) : null}
          </article>
          <form className="rounded-3xl border border-white/10 bg-panel p-6" onSubmit={onLookup}>
            <label className="grid gap-2 text-sm text-vx-cyan" htmlFor="room-code">
              Código de sala
              <input
                id="room-code"
                className="rounded-2xl border border-white/15 bg-ink px-4 py-3 text-lg font-semibold uppercase tracking-[0.12em] text-white"
                value={roomCode}
                onChange={(event) => setRoomCode(event.target.value)}
              />
            </label>
            <button className="mt-4 rounded-2xl bg-vx-magenta px-4 py-3 font-semibold text-ink disabled:opacity-50" disabled={pending} type="submit">
              Consultar
            </button>
          </form>
          {detail ? <SessionResult detail={detail} /> : null}
        </section>
      )}
    </main>
  );
}

function SessionResult({ detail }: { detail: SessionDetail }) {
  return (
    <article className="rounded-3xl border border-vx-cyan/30 bg-panel p-6">
      <h2 className="text-2xl font-bold tracking-[0.08em]">{detail.roomCode}</h2>
      <p className="mt-1 text-white/70">{formatFinishedAt(detail.finishedAt)}</p>
      <h3 className="mt-5 text-sm uppercase tracking-[0.16em] text-vx-cyan">Podio</h3>
      {detail.podium.length === 0 ? <p className="mt-2">La API no envió puestos de podio.</p> : (
        <ol className="mt-2 grid gap-2">
          {detail.podium.map((place) => (
            <li key={place.userId}>
              {place.position}. {place.displayName} · {place.score}
            </li>
          ))}
        </ol>
      )}
      <h3 className="mt-5 text-sm uppercase tracking-[0.16em] text-vx-cyan">Clasificación</h3>
      <ol className="mt-2 grid gap-2">
        {detail.participants.map((entry) => (
          <li key={entry.userId}>
            {entry.rank}. {entry.displayName} · {entry.score}
          </li>
        ))}
      </ol>
    </article>
  );
}

function applyReadError(
  error: unknown,
  setToken: (value: string | null) => void,
  setSessions: (value: SessionSummary[] | null) => void,
  setDetail: (value: SessionDetail | null) => void,
  setUser: (value: ApiUser | null) => void,
  setNotice: (value: string | null) => void,
): void {
  const message = error instanceof ApiError ? error.message : "La API rechazó la consulta.";
  const status = error instanceof ApiError ? error.status : 0;
  setDetail(null);
  setNotice(message);
  if (status === 401) {
    clearToken();
    setToken(null);
    setUser(null);
    setSessions(null);
  }
}

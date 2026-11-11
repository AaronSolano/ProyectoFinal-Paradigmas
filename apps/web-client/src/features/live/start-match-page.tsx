import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { HttpError } from "../../shared/http";
import { paths, teacherRoomPath } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import { listQuestions, listQuizzes, type QuizSummary } from "../quizzes/quiz-api";
import { createLiveSession } from "./live-api";
import { canCreateRoom } from "./lobby-model";

type QuizChoice = QuizSummary & { questionCount: number };

const lobbyTitleKey = (roomCode: string) => `verix.lobbyTitle.${roomCode}`;

export function rememberLobbyTitle(roomCode: string, title: string): void {
  sessionStorage.setItem(lobbyTitleKey(roomCode), title);
}

export function readLobbyTitle(roomCode: string): string | null {
  return sessionStorage.getItem(lobbyTitleKey(roomCode));
}

export function StartMatchPage() {
  const navigate = useNavigate();
  const creating = useRef(false);
  const [quizzes, setQuizzes] = useState<QuizChoice[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = quizzes.find((quiz) => quiz.id === selectedId) ?? null;

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setError("La sesión expiró.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    listQuizzes(token)
      .then(async (loaded) => {
        const choices = await Promise.all(
          loaded.map(async (quiz) => {
            const questions = await listQuestions(token, quiz.id);
            return { ...quiz, questionCount: questions.length };
          }),
        );
        if (!cancelled) {
          setQuizzes(choices);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof HttpError ? caught.message : "No se pudieron cargar los cuestionarios.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function onCreateRoom() {
    if (creating.current || !selected || !canCreateRoom(selected.questionCount)) {
      return;
    }
    const token = readStoredToken();
    if (!token) {
      setError("La sesión expiró.");
      return;
    }
    creating.current = true;
    setBusy(true);
    setError(null);
    try {
      const created = await createLiveSession(token, selected.id);
      rememberLobbyTitle(created.roomCode, selected.title);
      navigate(teacherRoomPath(created.roomCode), { state: { quizTitle: selected.title } });
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo crear la sala.");
    } finally {
      creating.current = false;
      setBusy(false);
    }
  }

  return (
    <ArenaFrame kicker="Profesor" title="Iniciar partida" workspace>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex flex-col rounded-2xl border border-white/10 bg-ink/50 p-4 lg:min-h-0 lg:overflow-hidden">
          <Link className="text-sm text-vx-cyan hover:text-white" to={paths.teacher}>
            Volver a la mesa
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Elige un cuestionario con preguntas. Crear la sala no modifica el banco ni el cuestionario.
          </p>
          {loading ? <p className="mt-4 text-vx-cyan">Cargando cuestionarios…</p> : null}
          {error ? (
            <p className="mt-4 rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
              {error}
            </p>
          ) : null}
          {!loading && quizzes.length === 0 ? (
            <p className="mt-4 text-white/75">
              Todavía no tienes cuestionarios.{" "}
              <Link className="text-vx-cyan" to={paths.teacherCreate}>
                Crea tu reto
              </Link>
              .
            </p>
          ) : null}
          <ul className="mt-4 grid content-start gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {quizzes.map((quiz) => {
              const active = quiz.id === selectedId;
              const ready = canCreateRoom(quiz.questionCount);
              return (
                <li key={quiz.id}>
                  <button
                    className={`w-full rounded-2xl border px-4 py-3 text-left ${active ? "border-vx-cyan bg-vx-cyan/10 shadow-neon" : "border-white/10"}`}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSelectedId(quiz.id)}
                  >
                    <span className={`block text-lg ${active ? "text-vx-cyan" : "text-white"}`}>{quiz.title}</span>
                    <span className="mt-1 block text-sm text-white/60">
                      {quiz.questionCount} {quiz.questionCount === 1 ? "pregunta" : "preguntas"}
                      {ready ? "" : " · no se puede iniciar"}
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </aside>
        <section className="flex flex-col justify-between rounded-2xl border border-vx-magenta/25 bg-ink/30 p-5 lg:min-h-0">
          {selected ? (
            <div>
              <h3 className="text-3xl font-bold">{selected.title}</h3>
              <p className="mt-3 text-lg text-white/75">
                {selected.questionCount} {selected.questionCount === 1 ? "pregunta lista" : "preguntas listas"}.
              </p>
              {selected.description ? <p className="mt-2 text-white/60">{selected.description}</p> : null}
              {!canCreateRoom(selected.questionCount) ? (
                <p className="mt-4 text-vx-magenta" role="alert">
                  Agrega al menos una pregunta antes de crear la sala.
                </p>
              ) : null}
            </div>
          ) : (
            <p className="text-lg text-white/70">Selecciona un cuestionario para ver sus preguntas y crear la sala.</p>
          )}
          <button
            className="mt-6 rounded-2xl bg-vx-magenta px-4 py-4 text-lg font-semibold text-ink disabled:opacity-50"
            disabled={busy || !selected || !canCreateRoom(selected.questionCount)}
            type="button"
            onClick={() => void onCreateRoom()}
          >
            {busy ? "Creando sala…" : "Crear sala"}
          </button>
        </section>
      </div>
    </ArenaFrame>
  );
}

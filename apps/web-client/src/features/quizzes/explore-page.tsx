import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { HttpError } from "../../shared/http";
import { paths } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import {
  CATEGORY_LABELS,
  CHALLENGE_CATEGORIES,
  CHALLENGE_DIFFICULTIES,
  DIFFICULTY_LABELS,
  SELECTION_LIMIT,
  searchTextIsReady,
  togglePromptSelection,
  type ChallengeCategoryCode,
  type ChallengeDifficultyCode,
  type PromptFilters,
} from "./catalog";
import {
  copyPrompts,
  listQuestions,
  listQuizzes,
  searchPrompts,
  type ChallengePromptItem,
  type QuizSummary,
} from "./quiz-api";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-3 text-base text-white";

const initialFilters: PromptFilters = { q: "", category: "", difficulty: "", page: 1 };

export function ExplorePage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [quizId, setQuizId] = useState("");
  const [questionCount, setQuestionCount] = useState<number | null>(null);
  const [filters, setFilters] = useState<PromptFilters>(initialFilters);
  const [draftQuery, setDraftQuery] = useState("");
  const [items, setItems] = useState<ChallengePromptItem[]>([]);
  const [total, setTotal] = useState(0);
  const [selected, setSelected] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [confirming, setConfirming] = useState(false);

  const selectedQuiz = quizzes.find((quiz) => quiz.id === quizId) ?? null;

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setError("La sesión expiró.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    listQuizzes(token)
      .then((loaded) => {
        if (cancelled) {
          return;
        }
        setQuizzes(loaded);
        if (loaded[0]) {
          setQuizId(loaded[0].id);
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

  useEffect(() => {
    const token = readStoredToken();
    if (!token || !quizId) {
      return;
    }
    let cancelled = false;
    listQuestions(token, quizId)
      .then((questions) => {
        if (!cancelled) {
          setQuestionCount(questions.length);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof HttpError ? caught.message : "No se pudieron leer las preguntas guardadas.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [quizId]);

  useEffect(() => {
    if (!quizId || !searchTextIsReady(filters.q)) {
      return;
    }
    const token = readStoredToken();
    if (!token) {
      return;
    }
    let cancelled = false;
    setSearching(true);
    searchPrompts(token, filters)
      .then((page) => {
        if (!cancelled) {
          setItems(page.items);
          setTotal(page.total);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof HttpError ? caught.message : "No se pudo consultar el banco.");
        }
      })
      .finally(() => {
        if (!cancelled) {
          setSearching(false);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [filters, quizId]);

  function applySearch() {
    if (!searchTextIsReady(draftQuery)) {
      setError("Escribe al menos 2 caracteres para buscar.");
      return;
    }
    setError(null);
    setFilters((current) => ({ ...current, q: draftQuery, page: 1 }));
  }

  function onToggle(id: string) {
    const next = togglePromptSelection(selected, id);
    setSelected(next.ids);
    setError(next.rejected ? `Puedes elegir hasta ${SELECTION_LIMIT} retos por vez.` : null);
  }

  async function confirmCopy() {
    const token = readStoredToken();
    if (!token || !selectedQuiz || selected.length === 0) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await copyPrompts(token, selectedQuiz.id, selected);
      setQuestionCount((current) => (current ?? 0) + created.length);
      setSelected([]);
      setConfirming(false);
      setNotice(
        `Se incorporaron ${created.length} retos a «${selectedQuiz.title}». El banco no cambió. Entrarán en la próxima sala.`,
      );
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudieron incorporar los retos.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ArenaFrame kicker="Profesor" title="Explora retos" workspace>
      <div className="grid min-h-0 flex-1 gap-4 lg:overflow-hidden xl:grid-cols-[minmax(18rem,22rem)_minmax(0,1fr)]">
        <aside className="flex flex-col rounded-2xl border border-white/10 bg-ink/50 lg:min-h-0 lg:overflow-hidden">
          <div className="flex flex-col gap-4 p-4 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
          <div>
            <Link className="text-sm text-vx-cyan hover:text-white" to={paths.teacher}>
              Volver a la mesa
            </Link>
            <p className="mt-3 text-sm leading-relaxed text-white/70">
              Elige un cuestionario propio. Copiar un reto crea una pregunta nueva y deja intacta la fila del banco.
            </p>
          </div>
          {loading ? <p className="text-vx-cyan">Cargando tus cuestionarios…</p> : null}
          {error ? (
            <p className="rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="text-vx-cyan" role="status">
              {notice}
            </p>
          ) : null}
          {!loading && quizzes.length === 0 ? (
            <p className="text-white/75">
              Primero crea un cuestionario en{" "}
              <Link className="text-vx-cyan" to={paths.teacherCreate}>
                Crea tu reto
              </Link>
              .
            </p>
          ) : null}
          {quizzes.length > 0 ? (
            <>
              <label className="block text-sm text-white/80">
                Cuestionario de destino
                <select className={fieldClass} value={quizId} onChange={(event) => setQuizId(event.target.value)}>
                  {quizzes.map((quiz) => (
                    <option key={quiz.id} value={quiz.id}>
                      {quiz.title}
                    </option>
                  ))}
                </select>
              </label>
              <p className="text-sm text-white/60">
                {questionCount === null
                  ? "Leyendo las preguntas ya guardadas…"
                  : `${questionCount} preguntas guardadas en este cuestionario.`}
              </p>
              <label className="block text-sm text-white/80">
                Buscar
                <input className={fieldClass} value={draftQuery} onChange={(event) => setDraftQuery(event.target.value)} />
              </label>
              <label className="block text-sm text-white/80">
                Categoría
                <select
                  className={fieldClass}
                  value={filters.category}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      category: event.target.value as ChallengeCategoryCode | "",
                      page: 1,
                    }))
                  }
                >
                  <option value="">Todas</option>
                  {CHALLENGE_CATEGORIES.map((category) => (
                    <option key={category} value={category}>
                      {CATEGORY_LABELS[category]}
                    </option>
                  ))}
                </select>
              </label>
              <label className="block text-sm text-white/80">
                Dificultad
                <select
                  className={fieldClass}
                  value={filters.difficulty}
                  onChange={(event) =>
                    setFilters((current) => ({
                      ...current,
                      difficulty: event.target.value as ChallengeDifficultyCode | "",
                      page: 1,
                    }))
                  }
                >
                  <option value="">Todas</option>
                  {CHALLENGE_DIFFICULTIES.map((difficulty) => (
                    <option key={difficulty} value={difficulty}>
                      {DIFFICULTY_LABELS[difficulty]}
                    </option>
                  ))}
                </select>
              </label>
              <button className="rounded-2xl border border-vx-cyan px-4 py-3 text-vx-cyan" type="button" onClick={applySearch}>
                Buscar
              </button>
            </>
          ) : null}
          </div>
          {quizzes.length > 0 ? (
            <div className="shrink-0 space-y-3 border-t border-vx-magenta/30 bg-panel/90 p-4">
              <p className="text-sm text-white/80">
                {selected.length} seleccionados · {total} en el banco para este filtro
              </p>
              <button
                className="w-full rounded-2xl bg-vx-magenta px-4 py-3 font-semibold text-ink disabled:opacity-50"
                disabled={busy || selected.length === 0}
                type="button"
                onClick={() => setConfirming(true)}
              >
                Incorporar selección
              </button>
              {confirming ? (
                <div className="rounded-2xl border border-vx-magenta/40 p-4">
                  <p>
                    Vas a copiar {selected.length} retos a «{selectedQuiz?.title}». Las filas del banco permanecen iguales.
                  </p>
                  <div className="mt-3 flex gap-2">
                    <button className="rounded-xl bg-vx-magenta px-4 py-2 font-semibold text-ink" disabled={busy} type="button" onClick={() => void confirmCopy()}>
                      Confirmar
                    </button>
                    <button className="rounded-xl border border-white/20 px-4 py-2" type="button" onClick={() => setConfirming(false)}>
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </aside>

        <section className="flex flex-col rounded-2xl border border-vx-cyan/20 bg-ink/30 p-4 sm:p-5 lg:min-h-0 lg:overflow-hidden">
          <div className="lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
          {searching ? <p className="text-vx-cyan">Buscando en el banco…</p> : null}
          {!searching && quizzes.length > 0 && items.length === 0 ? (
            <p className="text-white/70">Nada coincide con la búsqueda.</p>
          ) : null}
          <ul className="grid gap-3 md:grid-cols-2">
            {items.map((item) => {
              const checked = selected.includes(item.id);
              const category = item.category as ChallengeCategoryCode;
              const difficulty = item.difficulty as ChallengeDifficultyCode;
              return (
                <li
                  className={`rounded-2xl border px-4 py-3 ${checked ? "border-vx-magenta/70 bg-vx-magenta/10" : "border-white/10 bg-panel/70"}`}
                  key={item.id}
                >
                  <label className="flex h-full gap-3">
                    <input checked={checked} className="mt-1" type="checkbox" onChange={() => onToggle(item.id)} />
                    <span>
                      <span className="block text-base leading-snug">{item.statement}</span>
                      <span className="mt-2 block text-sm text-white/60">
                        {CATEGORY_LABELS[category] ?? item.category} · {DIFFICULTY_LABELS[difficulty] ?? item.difficulty} ·{" "}
                        {item.suggestedTimeLimitSeconds} s · Respuesta: {item.correctAnswer ? "Verdadero" : "Falso"}
                      </span>
                    </span>
                  </label>
                </li>
              );
            })}
          </ul>
          </div>
          {quizzes.length > 0 ? (
            <div className="mt-4 flex shrink-0 justify-end gap-2 text-sm text-white/70">
              <button
                className="rounded-xl border border-white/15 px-3 py-2 disabled:opacity-40"
                disabled={filters.page <= 1}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, page: current.page - 1 }))}
              >
                Anterior
              </button>
              <button
                className="rounded-xl border border-white/15 px-3 py-2 disabled:opacity-40"
                disabled={filters.page * 12 >= total}
                type="button"
                onClick={() => setFilters((current) => ({ ...current, page: current.page + 1 }))}
              >
                Siguiente
              </button>
            </div>
          ) : null}
        </section>
      </div>
    </ArenaFrame>
  );
}

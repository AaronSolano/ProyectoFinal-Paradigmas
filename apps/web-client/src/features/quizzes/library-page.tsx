import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { HttpError } from "../../shared/http";
import { paths } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import { CATEGORY_LABELS, CHALLENGE_CATEGORIES, type ChallengeCategoryCode } from "./catalog";
import {
  copyLibraryQuiz,
  getLibraryQuiz,
  listLibraryQuizzes,
  type LibraryQuizDetail,
  type LibraryQuizSummary,
} from "./quiz-api";
import { libraryHasNextPage, libraryListPath } from "./quiz-library";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-3 text-base text-white";

export function LibraryPage() {
  const [category, setCategory] = useState<ChallengeCategoryCode | "">("");
  const [page, setPage] = useState(1);
  const [items, setItems] = useState<LibraryQuizSummary[]>([]);
  const [total, setTotal] = useState(0);
  const [detail, setDetail] = useState<LibraryQuizDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setError("La sesión expirió.");
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    listLibraryQuizzes(token, libraryListPath({ category, page }))
      .then((result) => {
        if (!cancelled) {
          setItems(result.items);
          setTotal(result.total);
          setError(null);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof HttpError ? caught.message : "No se pudo consultar la biblioteca.");
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
  }, [category, page]);

  async function openDetail(quizId: string) {
    const token = readStoredToken();
    if (!token) {
      return;
    }
    setBusy(true);
    setError(null);
    setNotice(null);
    try {
      setDetail(await getLibraryQuiz(token, quizId));
    } catch (caught: unknown) {
      setDetail(null);
      setError(caught instanceof HttpError ? caught.message : "No se pudo abrir el cuestionario.");
    } finally {
      setBusy(false);
    }
  }

  async function copyDetail() {
    const token = readStoredToken();
    if (!token || !detail) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const copy = await copyLibraryQuiz(token, detail.id);
      setNotice(`Se creó «${copy.title}» en tus cuestionarios. Es privado y puedes editarlo sin afectar el original.`);
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo copiar el cuestionario.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ArenaFrame kicker="Profesor" title="Biblioteca de cuestionarios" workspace>
      <div className="grid min-h-0 flex-1 gap-4 lg:overflow-hidden xl:grid-cols-[minmax(18rem,26rem)_minmax(0,1fr)]">
        <aside className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-ink/50 p-4 lg:min-h-0 lg:overflow-y-auto">
          <Link className="text-sm text-vx-cyan hover:text-white" to={paths.teacher}>
            Volver a la mesa
          </Link>
          <p className="text-sm leading-relaxed text-white/70">
            Cuestionarios completos que otros profesores publicaron. Al copiar uno obtienes una versión privada tuya.
          </p>
          <label className="block text-sm text-white/80">
            Categoría
            <select
              className={fieldClass}
              value={category}
              onChange={(event) => {
                setCategory(event.target.value as ChallengeCategoryCode | "");
                setPage(1);
                setDetail(null);
              }}
            >
              <option value="">Todas</option>
              {CHALLENGE_CATEGORIES.map((code) => (
                <option key={code} value={code}>
                  {CATEGORY_LABELS[code]}
                </option>
              ))}
            </select>
          </label>
          {error ? (
            <p className="rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
              {error}
            </p>
          ) : null}
          {loading ? <p className="text-vx-cyan">Cargando la biblioteca…</p> : null}
          {!loading && items.length === 0 && !error ? (
            <p className="text-white/70">Todavía no hay cuestionarios publicados para este filtro.</p>
          ) : null}
          <ul className="grid gap-2">
            {items.map((quiz) => {
              const active = detail?.id === quiz.id;
              return (
                <li
                  className={`rounded-2xl border px-3 py-3 ${active ? "border-vx-cyan bg-vx-cyan/10" : "border-white/10 bg-panel/40"}`}
                  key={quiz.id}
                >
                  <button className="w-full text-left" disabled={busy} type="button" onClick={() => void openDetail(quiz.id)}>
                    <span className="block text-base font-medium text-white">{quiz.title}</span>
                    <span className="mt-1 block text-sm text-white/60">
                      {quiz.category ? CATEGORY_LABELS[quiz.category] : "Sin categoría"} · {quiz.questionCount} preguntas
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
          <div className="flex justify-end gap-2 text-sm text-white/70">
            <button
              className="rounded-xl border border-white/15 px-3 py-2 disabled:opacity-40"
              disabled={page <= 1}
              type="button"
              onClick={() => setPage((current) => current - 1)}
            >
              Anterior
            </button>
            <button
              className="rounded-xl border border-white/15 px-3 py-2 disabled:opacity-40"
              disabled={!libraryHasNextPage(page, total)}
              type="button"
              onClick={() => setPage((current) => current + 1)}
            >
              Siguiente
            </button>
          </div>
        </aside>

        <section className="rounded-2xl border border-vx-cyan/20 bg-ink/30 p-4 sm:p-5 lg:min-h-0 lg:overflow-y-auto">
          {notice ? (
            <p className="mb-4 text-vx-cyan" role="status">
              {notice}{" "}
              <Link className="underline" to={paths.teacherCreate}>
                Ir a Crea tu reto
              </Link>
            </p>
          ) : null}
          {detail ? (
            <div>
              <h3 className="text-2xl font-semibold">{detail.title}</h3>
              <p className="mt-1 text-sm text-white/60">
                {detail.category ? CATEGORY_LABELS[detail.category] : "Sin categoría"}
              </p>
              {detail.description ? <p className="mt-3 text-white/80">{detail.description}</p> : null}
              <ul className="mt-4 grid gap-3">
                {detail.questions.map((question) => (
                  <li className="rounded-2xl border border-white/10 bg-panel/70 px-4 py-3" key={question.id}>
                    <p>{question.statement}</p>
                    <p className="mt-1 text-sm text-white/60">
                      Respuesta: {question.correctAnswer ? "Verdadero" : "Falso"} · {question.timeLimitSeconds} s
                    </p>
                  </li>
                ))}
              </ul>
              <button
                className="mt-5 rounded-2xl bg-vx-magenta px-4 py-3 font-semibold text-ink disabled:opacity-50"
                disabled={busy}
                type="button"
                onClick={() => void copyDetail()}
              >
                Copiar a mis cuestionarios
              </button>
            </div>
          ) : (
            <div className="flex min-h-64 items-center justify-center rounded-2xl border border-dashed border-vx-cyan/30 p-8 text-center text-white/70">
              Elige un cuestionario de la lista para ver sus preguntas y respuestas.
            </div>
          )}
        </section>
      </div>
    </ArenaFrame>
  );
}

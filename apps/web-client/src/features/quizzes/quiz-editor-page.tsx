import { FormEvent, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { HttpError } from "../../shared/http";
import { paths } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import {
  createQuestion,
  createQuiz,
  deleteQuestion,
  deleteQuiz,
  listQuestions,
  listQuizzes,
  updateQuestion,
  updateQuiz,
  uploadQuestionImage,
  type QuizQuestion,
  type QuizSummary,
} from "./quiz-api";
import { questionTimeLimitError } from "./question-time";
import { resolveQuizSelection } from "./quiz-selection";

const fieldClass =
  "mt-2 w-full rounded-2xl border border-white/15 bg-ink px-4 py-3 text-base text-white";

export function QuizEditorPage() {
  const [quizzes, setQuizzes] = useState<QuizSummary[]>([]);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [statement, setStatement] = useState("");
  const [correctAnswer, setCorrectAnswer] = useState(true);
  const [timeLimit, setTimeLimit] = useState("20");
  const [image, setImage] = useState<File | null>(null);
  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);
  const [pendingDelete, setPendingDelete] = useState<{ kind: "quiz" | "question"; id: string } | null>(
    null,
  );

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
      .then((items) => {
        if (cancelled) {
          return;
        }
        const nextId = resolveQuizSelection(
          items.map((quiz) => quiz.id),
          null,
        );
        const chosen = items.find((quiz) => quiz.id === nextId) ?? null;
        setQuizzes(items);
        setSelectedId(nextId);
        setTitle(chosen?.title ?? "");
        setDescription(chosen?.description ?? "");
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
    if (!token || !selectedId) {
      return;
    }
    let cancelled = false;
    listQuestions(token, selectedId)
      .then((items) => {
        if (!cancelled) {
          setQuestions(items);
        }
      })
      .catch((caught: unknown) => {
        if (!cancelled) {
          setError(caught instanceof HttpError ? caught.message : "No se pudieron cargar las preguntas.");
        }
      });
    return () => {
      cancelled = true;
    };
  }, [selectedId]);

  async function onCreateQuiz(event: FormEvent) {
    event.preventDefault();
    const token = readStoredToken();
    const nextTitle = title.trim();
    if (!token) {
      setError("La sesión expiró.");
      return;
    }
    if (nextTitle.length < 3) {
      setError("El título necesita al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const created = await createQuiz(token, {
        title: nextTitle,
        description: description.trim() || undefined,
      });
      setQuizzes((current) => [created, ...current]);
      setSelectedId(created.id);
      setQuestions([]);
      setTitle("");
      setDescription("");
      setNotice("Cuestionario creado. Sigue siendo privado.");
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo crear el cuestionario.");
    } finally {
      setBusy(false);
    }
  }

  async function onRename(event: FormEvent) {
    event.preventDefault();
    const token = readStoredToken();
    if (!token || !selected) {
      return;
    }
    const nextTitle = title.trim();
    if (nextTitle.length < 3) {
      setError("El título necesita al menos 3 caracteres.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const updated = await updateQuiz(token, selected.id, {
        title: nextTitle,
        description: description.trim() || undefined,
      });
      setQuizzes((current) => current.map((quiz) => (quiz.id === updated.id ? updated : quiz)));
      setNotice("Cuestionario actualizado.");
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo actualizar el cuestionario.");
    } finally {
      setBusy(false);
    }
  }

  async function onSaveQuestion(event: FormEvent) {
    event.preventDefault();
    const token = readStoredToken();
    const nextStatement = statement.trim();
    if (!token || !selected) {
      setError("Elige un cuestionario antes de agregar la pregunta.");
      return;
    }
    if (nextStatement.length < 3) {
      setError("La afirmación necesita al menos 3 caracteres.");
      return;
    }
    const timeError = questionTimeLimitError(timeLimit);
    if (timeError) {
      setError(timeError);
      return;
    }
    const seconds = Number(timeLimit);
    if (image && !["image/jpeg", "image/png", "image/webp"].includes(image.type)) {
      setError("La imagen debe ser JPEG, PNG o WebP.");
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const imageUrl = image ? (await uploadQuestionImage(token, image)).url : undefined;
      if (editingQuestionId) {
        const updated = await updateQuestion(token, selected.id, editingQuestionId, {
          statement: nextStatement,
          correctAnswer,
          timeLimitSeconds: seconds,
          ...(imageUrl ? { imageUrl } : {}),
        });
        setQuestions((current) => current.map((item) => (item.id === updated.id ? updated : item)));
        setNotice("Pregunta actualizada.");
      } else {
        const sortOrder = questions.reduce((max, item) => Math.max(max, item.sortOrder), -1) + 1;
        const created = await createQuestion(token, selected.id, {
          statement: nextStatement,
          correctAnswer,
          timeLimitSeconds: seconds,
          imageUrl,
          sortOrder,
        });
        setQuestions((current) => [...current, created]);
        setNotice("Pregunta agregada.");
      }
      setStatement("");
      setCorrectAnswer(true);
      setTimeLimit("20");
      setImage(null);
      setEditingQuestionId(null);
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo guardar la pregunta.");
    } finally {
      setBusy(false);
    }
  }

  async function confirmDelete() {
    const token = readStoredToken();
    if (!token || !pendingDelete) {
      return;
    }
    setBusy(true);
    setError(null);
    try {
      if (pendingDelete.kind === "quiz") {
        await deleteQuiz(token, pendingDelete.id);
        const remaining = quizzes.filter((quiz) => quiz.id !== pendingDelete.id);
        const nextId =
          selectedId === pendingDelete.id
            ? resolveQuizSelection(
                remaining.map((quiz) => quiz.id),
                null,
              )
            : selectedId;
        const chosen = remaining.find((quiz) => quiz.id === nextId) ?? null;
        setQuizzes(remaining);
        setSelectedId(nextId);
        if (selectedId === pendingDelete.id) {
          setQuestions([]);
          setTitle(chosen?.title ?? "");
          setDescription(chosen?.description ?? "");
          setEditingQuestionId(null);
        }
        setNotice("Cuestionario eliminado.");
      } else if (selected) {
        await deleteQuestion(token, selected.id, pendingDelete.id);
        setQuestions((current) => current.filter((item) => item.id !== pendingDelete.id));
        setNotice("Pregunta eliminada.");
      }
      setPendingDelete(null);
    } catch (caught: unknown) {
      setError(caught instanceof HttpError ? caught.message : "No se pudo eliminar.");
    } finally {
      setBusy(false);
    }
  }

  function selectQuiz(quiz: QuizSummary) {
    setSelectedId(quiz.id);
    setTitle(quiz.title);
    setDescription(quiz.description ?? "");
    setEditingQuestionId(null);
    setPendingDelete((current) => (current?.kind === "quiz" ? null : current));
  }

  function beginEdit(question: QuizQuestion) {
    setEditingQuestionId(question.id);
    setStatement(question.statement);
    setCorrectAnswer(question.correctAnswer);
    setTimeLimit(String(question.timeLimitSeconds));
    setImage(null);
  }

  return (
    <ArenaFrame kicker="Profesor" title="Crea tu reto" workspace>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(18rem,24rem)_minmax(0,1fr)] lg:overflow-hidden">
        <aside className="flex flex-col rounded-2xl border border-white/10 bg-ink/50 p-4 lg:min-h-0 lg:overflow-hidden">
          <Link className="text-sm text-vx-cyan hover:text-white" to={paths.teacher}>
            Volver a la mesa
          </Link>
          <p className="mt-3 text-sm leading-relaxed text-white/70">
            Las preguntas se guardan en tu cuestionario. El banco compartido no se modifica desde esta pantalla.
          </p>
          {loading ? <p className="mt-4 text-vx-cyan">Cargando cuestionarios…</p> : null}
          {error ? (
            <p className="mt-4 rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
              {error}
            </p>
          ) : null}
          {notice ? (
            <p className="mt-4 text-vx-cyan" role="status">
              {notice}
            </p>
          ) : null}

          <button
            className="mt-4 rounded-2xl border border-white/15 px-4 py-2 text-sm text-white/80 hover:border-vx-cyan"
            type="button"
            onClick={() => {
              setSelectedId(null);
              setTitle("");
              setDescription("");
              setQuestions([]);
              setEditingQuestionId(null);
            }}
          >
            Nuevo cuestionario
          </button>
          <form className="mt-4 grid shrink-0 gap-3" onSubmit={selected ? onRename : onCreateQuiz}>
            <label className="text-sm text-white/80">
              Título
              <input className={fieldClass} value={title} minLength={3} onChange={(event) => setTitle(event.target.value)} />
            </label>
            <label className="text-sm text-white/80">
              Descripción
              <textarea className={fieldClass} value={description} rows={2} onChange={(event) => setDescription(event.target.value)} />
            </label>
            <button
              className="rounded-2xl bg-vx-cyan px-4 py-3 font-semibold text-ink disabled:opacity-50"
              disabled={busy}
              type="submit"
            >
              {selected ? "Guardar título" : "Crear cuestionario"}
            </button>
          </form>

          <ul className="mt-4 grid content-start gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto lg:pr-1">
            {quizzes.map((quiz) => {
              const active = quiz.id === selectedId;
              return (
                <li
                  className={`rounded-2xl border px-3 py-3 ${active ? "border-vx-cyan bg-vx-cyan/10 shadow-neon" : "border-white/10 bg-panel/40"}`}
                  key={quiz.id}
                >
                  <button className="w-full text-left" type="button" onClick={() => selectQuiz(quiz)}>
                    <span className={`block text-base font-medium ${active ? "text-vx-cyan" : "text-white"}`}>{quiz.title}</span>
                    {quiz.description ? <span className="mt-1 block text-sm text-white/60">{quiz.description}</span> : null}
                  </button>
                  <div className="mt-3 flex items-center justify-between gap-2">
                    <button
                      className="rounded-xl border border-vx-cyan/50 px-3 py-2 text-sm text-vx-cyan"
                      type="button"
                      aria-pressed={active}
                      onClick={() => selectQuiz(quiz)}
                    >
                      Editar
                    </button>
                    <button
                      className="rounded-xl px-3 py-2 text-sm text-white/50 hover:text-vx-magenta"
                      type="button"
                      onClick={() => setPendingDelete({ kind: "quiz", id: quiz.id })}
                    >
                      Eliminar
                    </button>
                  </div>
                </li>
              );
            })}
          </ul>
          {pendingDelete?.kind === "quiz" ? (
            <div className="mt-3 shrink-0 rounded-2xl border border-vx-magenta/40 p-3">
              <p>¿Confirmas eliminar este cuestionario?</p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-xl bg-vx-magenta px-4 py-2 font-semibold text-ink" disabled={busy} type="button" onClick={() => void confirmDelete()}>
                  Confirmar
                </button>
                <button className="rounded-xl border border-white/20 px-4 py-2" type="button" onClick={() => setPendingDelete(null)}>
                  Cancelar
                </button>
              </div>
            </div>
          ) : null}
        </aside>

        <section className="rounded-2xl border border-vx-magenta/25 bg-ink/30 p-4 sm:p-5 lg:min-h-0 lg:overflow-hidden">
          {selected ? (
            <div className="grid gap-5 lg:h-full lg:min-h-0 xl:grid-cols-[minmax(0,1fr)_minmax(18rem,24rem)]">
              <div className="lg:min-h-0 lg:overflow-y-auto lg:pr-1">
                <h3 className="text-2xl font-semibold">Preguntas de {selected.title}</h3>
                <ul className="mt-4 grid gap-3">
                  {questions.map((question) => (
                    <li className="rounded-2xl border border-white/10 bg-panel/70 px-4 py-3" key={question.id}>
                      <p>{question.statement}</p>
                      <p className="mt-1 text-sm text-white/60">
                        {question.correctAnswer ? "Verdadero" : "Falso"} · {question.timeLimitSeconds} s
                      </p>
                      <div className="mt-3 flex gap-2">
                        <button className="rounded-xl border border-vx-cyan/40 px-3 py-2 text-sm" type="button" onClick={() => beginEdit(question)}>
                          Editar
                        </button>
                        <button
                          className="rounded-xl border border-vx-magenta/50 px-3 py-2 text-sm text-vx-magenta"
                          type="button"
                          onClick={() => setPendingDelete({ kind: "question", id: question.id })}
                        >
                          Eliminar
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
                {questions.length === 0 ? <p className="mt-3 text-white/60">Este cuestionario todavía no tiene preguntas.</p> : null}
                {pendingDelete?.kind === "question" ? (
                  <div className="mt-4 rounded-2xl border border-vx-magenta/40 p-4">
                    <p>¿Confirmas eliminar esta pregunta?</p>
                    <div className="mt-3 flex gap-2">
                      <button className="rounded-xl bg-vx-magenta px-4 py-2 font-semibold text-ink" disabled={busy} type="button" onClick={() => void confirmDelete()}>
                        Confirmar
                      </button>
                      <button className="rounded-xl border border-white/20 px-4 py-2" type="button" onClick={() => setPendingDelete(null)}>
                        Cancelar
                      </button>
                    </div>
                  </div>
                ) : null}
              </div>

              <form className="grid h-fit gap-4 rounded-2xl border border-vx-cyan/30 p-4 lg:min-h-0 lg:overflow-y-auto" onSubmit={onSaveQuestion}>
                <h3 className="text-lg font-semibold text-vx-cyan">{editingQuestionId ? "Editar pregunta" : "Nueva pregunta"}</h3>
                <label className="text-sm text-white/80">
                  Afirmación
                  <textarea className={fieldClass} value={statement} rows={4} onChange={(event) => setStatement(event.target.value)} />
                </label>
                <fieldset className="flex gap-4">
                  <legend className="text-sm text-white/80">Respuesta correcta</legend>
                  <label className="mt-2">
                    <input checked={correctAnswer} className="mr-2" name="answer" type="radio" onChange={() => setCorrectAnswer(true)} />
                    Verdadero
                  </label>
                  <label className="mt-2">
                    <input checked={!correctAnswer} className="mr-2" name="answer" type="radio" onChange={() => setCorrectAnswer(false)} />
                    Falso
                  </label>
                </fieldset>
                <label className="text-sm text-white/80">
                  Tiempo en segundos
                  <input className={fieldClass} inputMode="numeric" min={5} max={120} value={timeLimit} onChange={(event) => setTimeLimit(event.target.value)} />
                </label>
                <label className="text-sm text-white/80">
                  Imagen opcional
                  <input
                    accept="image/jpeg,image/png,image/webp"
                    className="mt-2 block w-full text-sm"
                    type="file"
                    onChange={(event) => setImage(event.target.files?.[0] ?? null)}
                  />
                </label>
                <button className="rounded-2xl border border-vx-cyan px-4 py-3 font-semibold text-vx-cyan disabled:opacity-50" disabled={busy} type="submit">
                  {editingQuestionId ? "Guardar pregunta" : "Agregar pregunta"}
                </button>
              </form>
            </div>
          ) : (
            <div className="flex h-full min-h-64 items-center justify-center rounded-2xl border border-dashed border-vx-cyan/30 p-8 text-center text-white/70">
              Elige un cuestionario o crea uno para redactar sus preguntas de verdadero o falso.
            </div>
          )}
        </section>
      </div>
    </ArenaFrame>
  );
}

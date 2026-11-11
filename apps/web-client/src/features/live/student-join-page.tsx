import { FormEvent, useEffect, useRef, useState } from "react";

import { Link, Navigate, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  SessionStatus,
  UserRole,
  WsEventNames,
  type GameAnswerAckPayload,
  type GameFinishResultsPayload,
  type GameQuestionOpenedPayload,
  type GameQuestionResultsPayload,
  type ParticipantSummary,
  type RoomParticipantJoinedPayload,
  type RoomStateSyncPayload,
} from "@profelink/shared-dtos";
import { useAuth } from "../auth/auth-context";
import { visibleIdentity } from "../../shared/arena-frame";
import { readClientEnv } from "../../shared/env";
import { paths, studentRoomPath } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import { recoverFinishedMatch } from "../results/session-api";
import { liveRoomMissing, shouldRecoverFinishedMatch } from "../results/session-history";
import { VerixMark } from "../../shared/verix-mark";
import {
  joinDisplayName,
  normalizeRoomCode,
  playerCount,
  visibleParticipantName,
  waitingMessage,
} from "./lobby-model";
import {
  answerAckMessage,
  answerFeedback,
  canSubmitAnswer,
  questionImageSrc,
  questionLabel,
  remainingSeconds,
  scoreOnLeaderboard,
  toOpenQuestion,
  type OpenQuestionView,
} from "./live-round";
import { rememberReturnPath } from "./return-path";
import { blocksLiveUpdates } from "./finish-view";
import { MatchFinish } from "./match-finish";

type ConnectionState = "idle" | "connecting" | "connected" | "disconnected" | "error";

const connectionLabel: Record<Exclude<ConnectionState, "idle">, string> = {
  connecting: "Conectando",
  connected: "Conectado",
  disconnected: "Desconectado",
  error: "Sin conexión",
};

export function StudentJoinPage() {
  const { user } = useAuth();
  const params = useParams();
  const roomCode = normalizeRoomCode(params.roomCode ?? "");
  const [attempt, setAttempt] = useState(0);
  const [joining, setJoining] = useState(false);
  const [confirmed, setConfirmed] = useState(false);
  const [connection, setConnection] = useState<ConnectionState>("idle");
  const [status, setStatus] = useState<SessionStatus | null>(null);
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [notice, setNotice] = useState<string | null>(null);
  const [question, setQuestion] = useState<OpenQuestionView | null>(null);
  const [results, setResults] = useState<GameQuestionResultsPayload | null>(null);
  const [submitted, setSubmitted] = useState<boolean | null>(null);
  const [locked, setLocked] = useState(false);
  const [myScore, setMyScore] = useState(0);
  const [finalRanking, setFinalRanking] = useState<GameFinishResultsPayload | null>(null);
  const finishedRef = useRef(false);
  const [now, setNow] = useState(() => Date.now());
  const socketRef = useRef<Socket | null>(null);

  const visibleName = joinDisplayName(user?.displayName, user?.role ?? UserRole.PARTICIPANT);

  useEffect(() => {
    if (!question) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [question]);

  useEffect(() => {
    if (!joining || !user || user.role !== UserRole.PARTICIPANT || !roomCode) {
      return;
    }
    const token = readStoredToken();
    if (!token) {
      setConnection("error");
      setNotice("La sesión expiró.");
      setConfirmed(false);
      return;
    }
    const { gameWsUrl } = readClientEnv();
    const socket = io(gameWsUrl, { auth: { token } });
    socketRef.current = socket;
    let closed = false;
    let joined = false;
    let generation = 0;
    const recover = () => {
      if (!shouldRecoverFinishedMatch(joined, finishedRef.current)) {
        return;
      }
      const ticket = generation;
      const currentToken = readStoredToken();
      if (!currentToken) {
        return;
      }
      void recoverFinishedMatch(currentToken, roomCode).then((outcome) => {
        if (closed || ticket !== generation || finishedRef.current || outcome === "missing") {
          return;
        }
        finishedRef.current = true;
        setFinalRanking(outcome);
        setConfirmed(true);
        setQuestion(null);
        setResults(null);
        setLocked(true);
        setStatus(SessionStatus.FINISHED);
        setNotice(null);
      }).catch(() => {
        if (!closed && ticket === generation && !finishedRef.current) {
          setNotice("No se pudo recuperar el resultado.");
        }
      });
    };
    const join = () => {
      socket.emit(WsEventNames.ROOM_JOIN, { roomCode, displayName: visibleName });
    };
    const onConnect = () => {
      if (closed) {
        return;
      }
      setConnection("connected");
      join();
    };
    const onDisconnect = () => {
      if (closed) {
        return;
      }
      setConnection("disconnected");
      if (!finishedRef.current) {
        setConfirmed(false);
        setNotice("Se perdió la conexión. Puedes reintentar.");
        recover();
      }
    };
    const onConnectError = (error: Error) => {
      if (closed) {
        return;
      }
      if (blocksLiveUpdates(finishedRef.current)) {
        setConnection("error");
        return;
      }
      setConnection("error");
      setConfirmed(false);
      setNotice(error.message || "No se pudo conectar con la sala.");
    };
    const onException = (payload: { message?: unknown }) => {
      if (closed || blocksLiveUpdates(finishedRef.current)) {
        return;
      }
      const message = payload && typeof payload.message === "string" ? payload.message : "La sala rechazó el ingreso.";
      setNotice(message);
      if (liveRoomMissing(message)) {
        recover();
      }
      if (!joined) {
        setConnection("error");
        setConfirmed(false);
      }
    };
    const onRoom = (payload: RoomStateSyncPayload | RoomParticipantJoinedPayload) => {
      if (closed || blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      setParticipants(payload.participants);
      if ("sessionStatus" in payload) {
        generation += 1;
        joined = true;
        setStatus(payload.sessionStatus);
        setMyScore(payload.myScore);
        setConfirmed(true);
        setConnection("connected");
        setNotice(null);
        if (payload.currentQuestion) {
          setQuestion(toOpenQuestion(payload.currentQuestion));
          setResults(null);
          setLocked(payload.hasAnsweredCurrentQuestion);
          if (!payload.hasAnsweredCurrentQuestion) {
            setSubmitted(null);
          }
        } else if (payload.sessionStatus !== SessionStatus.QUESTION_CLOSED) {
          setQuestion(null);
          setResults(null);
        }
      }
    };
    const onOpened = (payload: GameQuestionOpenedPayload) => {
      if (closed || blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      setQuestion(toOpenQuestion(payload));
      setResults(null);
      setSubmitted(null);
      setLocked(false);
      setStatus(SessionStatus.QUESTION_ACTIVE);
      setNotice(null);
    };
    const onAck = (payload: GameAnswerAckPayload) => {
      if (closed || blocksLiveUpdates(finishedRef.current)) {
        return;
      }
      setLocked(true);
      setNotice(answerAckMessage(payload.accepted, payload.reason));
    };
    const onResults = (payload: GameQuestionResultsPayload) => {
      if (closed || blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      setResults(payload);
      setQuestion(null);
      setStatus(SessionStatus.QUESTION_CLOSED);
      setNotice(null);
      const mine = user ? scoreOnLeaderboard(payload.leaderboard, user.id) : null;
      if (mine) {
        setMyScore(mine.score);
      }
    };
    const onFinished = (payload: GameFinishResultsPayload) => {
      if (
        closed ||
        payload.roomCode !== roomCode ||
        !Array.isArray(payload.finalLeaderboard) ||
        !Array.isArray(payload.podium)
      ) {
        return;
      }
      finishedRef.current = true;
      setFinalRanking(payload);
      setQuestion(null);
      setResults(null);
      setLocked(true);
      setStatus(SessionStatus.FINISHED);
      setNotice(null);
      const mine = user ? scoreOnLeaderboard(payload.finalLeaderboard, user.id) : null;
      if (mine) {
        setMyScore(mine.score);
      }
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("exception", onException);
    socket.on(WsEventNames.ROOM_STATE_SYNC, onRoom);
    socket.on(WsEventNames.ROOM_PARTICIPANT_JOINED, onRoom);
    socket.on(WsEventNames.GAME_QUESTION_OPENED, onOpened);
    socket.on(WsEventNames.GAME_ANSWER_ACK, onAck);
    socket.on(WsEventNames.GAME_QUESTION_RESULTS, onResults);
    socket.on(WsEventNames.GAME_FINISH, onFinished);
    if (socket.connected) {
      onConnect();
    }

    return () => {
      closed = true;
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("exception", onException);
      socket.off(WsEventNames.ROOM_STATE_SYNC, onRoom);
      socket.off(WsEventNames.ROOM_PARTICIPANT_JOINED, onRoom);
      socket.off(WsEventNames.GAME_QUESTION_OPENED, onOpened);
      socket.off(WsEventNames.GAME_ANSWER_ACK, onAck);
      socket.off(WsEventNames.GAME_QUESTION_RESULTS, onResults);
      socket.off(WsEventNames.GAME_FINISH, onFinished);
      socketRef.current = null;
      socket.disconnect();
    };
  }, [attempt, joining, roomCode, user, visibleName]);

  if (!roomCode) {
    return <Navigate to={paths.student} replace />;
  }
  if (!user) {
    rememberReturnPath(studentRoomPath(roomCode));
    return <Navigate to={paths.login} replace />;
  }
  if (user.role !== UserRole.PARTICIPANT) {
    return (
      <main className="mx-auto flex min-h-screen w-full max-w-xl items-center px-4 py-8">
        <section className="w-full rounded-3xl border border-vx-cyan/30 bg-panel/90 p-6 text-center shadow-neon">
          <VerixMark />
          <h2 className="mt-4 text-3xl font-bold">Esta entrada es para estudiantes</h2>
          <p className="mt-4 text-white/75">El profesor controla la partida desde su lobby.</p>
          <Link className="mt-6 inline-block text-vx-cyan" to={paths.teacher}>
            Volver a la mesa
          </Link>
        </section>
      </main>
    );
  }

  const players = playerCount(participants);

  function onJoin(event: FormEvent) {
    event.preventDefault();
    setNotice(null);
    setConfirmed(false);
    setJoining(true);
    setConnection("connecting");
    setAttempt((current) => current + 1);
  }

  function submitAnswer(answer: boolean) {
    if (!canSubmitAnswer(locked, connection === "connected", Boolean(question))) {
      return;
    }
    setSubmitted(answer);
    setLocked(true);
    socketRef.current?.emit(WsEventNames.GAME_SUBMIT_ANSWER, { answer });
  }

  const imageSrc = question ? questionImageSrc(question.imageUrl, readClientEnv().gameApiUrl) : null;
  const mine = results && user ? scoreOnLeaderboard(results.leaderboard, user.id) : null;
  const heading = confirmed && question
    ? "Responde"
    : confirmed && results
      ? "Resultado"
      : confirmed
        ? "Sala de espera"
        : "Unirme al reto";

  return (
    <main className={`mx-auto flex min-h-screen w-full flex-col px-4 py-6 ${finalRanking ? "max-w-5xl" : "max-w-xl justify-center"}`}>
      <section className="rounded-3xl border border-vx-cyan/30 bg-panel/90 p-5 shadow-neon sm:p-8">
        <VerixMark />
        <p className="mt-3 text-sm font-medium uppercase tracking-[0.22em] text-vx-cyan">Estudiante</p>
        {finalRanking ? null : <h2 className="mt-2 text-3xl font-bold">{heading}</h2>}
        {finalRanking ? null : (
          <>
            <p className="mt-6 text-sm uppercase tracking-[0.16em] text-white/50">Código de sala</p>
            <p className="mt-1 text-5xl font-bold tracking-[0.14em] text-vx-cyan">{roomCode}</p>
            <p className="mt-4 text-lg text-white/80">
              Entrarás como <span className="font-semibold text-white">{visibleName}</span>
            </p>
          </>
        )}
        {connection !== "idle" ? (
          <p className={`mt-3 text-sm ${connection === "connected" ? "text-vx-cyan" : "text-vx-magenta"}`} role="status">
            WebSocket: {connectionLabel[connection]}
          </p>
        ) : null}
        {notice ? (
          <p className="mt-4 rounded-2xl border border-vx-magenta/50 px-4 py-3 text-vx-magenta" role="alert">
            {notice}
          </p>
        ) : null}
        {confirmed && finalRanking ? (
          <div className="mt-4">
            <MatchFinish
              connected={connection === "connected"}
              highlightUserId={user.id}
              result={finalRanking}
              returnLabel="Volver al inicio"
              returnTo={paths.student}
            />
          </div>
        ) : null}
        {confirmed && question && !finalRanking ? (
          <article className="mt-6">
            <p className="text-sm uppercase tracking-[0.16em] text-vx-magenta">{questionLabel(question.questionIndex)}</p>
            <h3 className="mt-2 text-3xl font-bold leading-tight">{question.statement}</h3>
            {imageSrc ? <img className="mt-4 max-h-56 w-full rounded-2xl object-contain" src={imageSrc} alt="" /> : null}
            <p className="mt-4 text-5xl font-bold text-vx-cyan" role="timer">
              {remainingSeconds(question.expiresAt, now)}s
            </p>
            <div className="mt-6 grid gap-3">
              <button
                className="min-h-16 rounded-2xl bg-vx-cyan px-4 py-5 text-2xl font-bold text-ink disabled:opacity-40"
                disabled={!canSubmitAnswer(locked, connection === "connected", true)}
                type="button"
                onClick={() => submitAnswer(true)}
              >
                Verdadero
              </button>
              <button
                className="min-h-16 rounded-2xl bg-vx-magenta px-4 py-5 text-2xl font-bold text-ink disabled:opacity-40"
                disabled={!canSubmitAnswer(locked, connection === "connected", true)}
                type="button"
                onClick={() => submitAnswer(false)}
              >
                Falso
              </button>
            </div>
          </article>
        ) : null}
        {confirmed && results && !question && !finalRanking ? (
          <article className="mt-6">
            <p className="text-sm uppercase tracking-[0.16em] text-vx-magenta">{questionLabel(results.questionIndex)}</p>
            <p className="mt-3 text-xl">{answerFeedback(submitted, results.correctAnswer)}</p>
            <p className="mt-2 text-white/70">Respuesta correcta: {results.correctAnswer ? "Verdadero" : "Falso"}</p>
            <p className="mt-4 text-lg text-vx-cyan">Tu puntaje: {mine?.score ?? myScore}</p>
            <ol className="mt-4 grid gap-2">
              {results.leaderboard.map((entry) => (
                <li className="flex justify-between rounded-xl border border-white/10 px-3 py-2" key={entry.userId}>
                  <span>
                    {entry.rank}. {visibleIdentity(entry.displayName) ?? "Participante"}
                  </span>
                  <span>{entry.score}</span>
                </li>
              ))}
            </ol>
          </article>
        ) : null}
        {confirmed && status && !question && !results && !finalRanking ? <p className="mt-4 text-lg text-white">{waitingMessage(status)}</p> : null}
        {confirmed && !question && !results && !finalRanking ? (
          <div className="mt-6">
            <p className="text-vx-magenta">
              {players} {players === 1 ? "jugador" : "jugadores"}
            </p>
            <ul className="mt-3 grid max-h-48 gap-2 overflow-y-auto">
              {participants.map((participant) => (
                <li className="rounded-xl border border-white/10 px-3 py-2" key={participant.userId}>
                  {visibleParticipantName(participant)}
                  <span className="ml-2 text-xs uppercase tracking-[0.14em] text-white/45">
                    {participant.role === UserRole.HOST ? "Anfitrión" : "Jugador"}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
        {!confirmed ? (
          <form className="mt-6" onSubmit={onJoin}>
            <button
              className="w-full rounded-2xl bg-gradient-to-r from-vx-cyan to-vx-magenta px-4 py-4 text-lg font-bold text-ink disabled:opacity-60"
              disabled={connection === "connecting"}
              type="submit"
            >
              {connection === "connecting" ? "Conectando…" : "Unirme al reto"}
            </button>
          </form>
        ) : null}
        {(connection === "error" || connection === "disconnected") && !finalRanking ? (
          <button
            className="mt-3 w-full rounded-2xl border border-vx-cyan px-4 py-3 text-vx-cyan"
            type="button"
            onClick={() => {
              setNotice(null);
              setConfirmed(false);
              setConnection("connecting");
              setAttempt((current) => current + 1);
            }}
          >
            Reintentar
          </button>
        ) : null}
        {finalRanking ? null : (
          <Link className="mt-6 inline-block text-sm text-white/60 hover:text-white" to={paths.student}>
            Usar otro código
          </Link>
        )}
      </section>
    </main>
  );
}

import { useEffect, useRef, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { Link, useLocation, useParams } from "react-router-dom";
import { io, type Socket } from "socket.io-client";
import {
  UserRole,
  WsEventNames,
  type GameFinishResultsPayload,
  type GameQuestionOpenedPayload,
  type GameQuestionResultsPayload,
  type LeaderboardEntry,
  type ParticipantSummary,
  type RoomParticipantJoinedPayload,
  type RoomStateSyncPayload,
} from "@profelink/shared-dtos";
import { useAuth } from "../auth/auth-context";
import { ArenaFrame, visibleIdentity } from "../../shared/arena-frame";
import { readClientEnv } from "../../shared/env";
import { paths } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import { recoverFinishedMatch } from "../results/session-api";
import { liveRoomMissing, shouldRecoverFinishedMatch } from "../results/session-history";
import { readLobbyTitle } from "./start-match-page";
import { inviteUrl, joinDisplayName, playerCount, visibleParticipantName } from "./lobby-model";
import { blocksLiveUpdates } from "./finish-view";
import { MatchFinish } from "./match-finish";
import {
  canOfferFinish,
  hostActionLabel,
  questionImageSrc,
  questionLabel,
  questionsExhausted,
  readNextQuestion,
  remainingSeconds,
  rememberNextQuestion,
  shouldEmitFinish,
  toOpenQuestion,
  type OpenQuestionView,
} from "./live-round";

type ConnectionState = "connecting" | "connected" | "disconnected" | "error";

const connectionLabel: Record<ConnectionState, string> = {
  connecting: "Conectando",
  connected: "Conectado",
  disconnected: "Desconectado",
  error: "Sin conexión",
};

export function HostLobbyPage() {
  const { roomCode = "" } = useParams();
  const location = useLocation();
  const { user } = useAuth();
  const routedTitle = (location.state as { quizTitle?: string } | null)?.quizTitle;
  const quizTitle = routedTitle?.trim() || readLobbyTitle(roomCode) || "Cuestionario";
  const [participants, setParticipants] = useState<ParticipantSummary[]>([]);
  const [connection, setConnection] = useState<ConnectionState>("connecting");
  const [notice, setNotice] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);
  const [question, setQuestion] = useState<OpenQuestionView | null>(null);
  const [results, setResults] = useState<GameQuestionResultsPayload | null>(null);
  const [nextIndex, setNextIndex] = useState(() => readNextQuestion(roomCode));
  const [exhausted, setExhausted] = useState(false);
  const [confirmFinish, setConfirmFinish] = useState(false);
  const [finishing, setFinishing] = useState(false);
  const [finalResult, setFinalResult] = useState<GameFinishResultsPayload | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const socketRef = useRef<Socket | null>(null);
  const openingRef = useRef(false);
  const finishedRef = useRef(false);
  const link = inviteUrl(window.location.origin, roomCode);
  const players = playerCount(participants);
  const { gameApiUrl } = readClientEnv();

  useEffect(() => {
    if (!question) {
      return;
    }
    const timer = window.setInterval(() => setNow(Date.now()), 250);
    return () => window.clearInterval(timer);
  }, [question]);

  useEffect(() => {
    const token = readStoredToken();
    if (!token || !roomCode) {
      setConnection("error");
      setNotice("La sesión expiró.");
      return;
    }
    const { gameWsUrl } = readClientEnv();
    const socket = io(gameWsUrl, { auth: { token } });
    socketRef.current = socket;
    let generation = 0;
    let entered = false;
    const recover = () => {
      if (!shouldRecoverFinishedMatch(entered, finishedRef.current)) {
        return;
      }
      const ticket = generation;
      const currentToken = readStoredToken();
      if (!currentToken) {
        return;
      }
      void recoverFinishedMatch(currentToken, roomCode).then((outcome) => {
        if (ticket !== generation || finishedRef.current || outcome === "missing") {
          return;
        }
        finishedRef.current = true;
        setFinalResult(outcome);
        setQuestion(null);
        setResults(null);
        setFinishing(false);
        setConfirmFinish(false);
        setNotice(null);
      }).catch(() => {
        if (ticket === generation && !finishedRef.current) {
          setNotice("No se pudo recuperar el resultado.");
        }
      });
    };
    const join = () => {
      socket.emit(WsEventNames.ROOM_JOIN, {
        roomCode,
        displayName: joinDisplayName(user?.displayName, UserRole.HOST),
      });
    };
    const onConnect = () => {
      setConnection("connected");
      setNotice(null);
      entered = true;
      join();
    };
    const onDisconnect = () => {
      setConnection("disconnected");
      recover();
    };
    const onConnectError = (error: Error) => {
      setConnection("error");
      setNotice(error.message || "No se pudo conectar con la sala.");
    };
    const onException = (payload: { message?: unknown }) => {
      const message = payload && typeof payload.message === "string" ? payload.message : "La sala rechazó la acción.";
      setNotice(message);
      openingRef.current = false;
      setFinishing(false);
      if (liveRoomMissing(message)) {
        recover();
      }
      if (questionsExhausted(message)) {
        setExhausted(true);
      }
    };
    const onSync = (payload: RoomStateSyncPayload) => {
      if (blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      generation += 1;
      setParticipants(payload.participants);
      if (payload.currentQuestion) {
        const opened = toOpenQuestion(payload.currentQuestion);
        setQuestion(opened);
        setResults(null);
        const following = opened.questionIndex + 1;
        setNextIndex(following);
        rememberNextQuestion(roomCode, opened.questionIndex);
      }
    };
    const onJoined = (payload: RoomParticipantJoinedPayload) => {
      if (payload.roomCode === roomCode) {
        setParticipants(payload.participants);
      }
    };
    const onOpened = (payload: GameQuestionOpenedPayload) => {
      if (blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      const opened = toOpenQuestion(payload);
      setQuestion(opened);
      setResults(null);
      setExhausted(false);
      setNotice(null);
      openingRef.current = false;
      setNextIndex(opened.questionIndex + 1);
      rememberNextQuestion(roomCode, opened.questionIndex);
    };
    const onResults = (payload: GameQuestionResultsPayload) => {
      if (blocksLiveUpdates(finishedRef.current) || payload.roomCode !== roomCode) {
        return;
      }
      setResults(payload);
      setQuestion(null);
      setNotice(null);
    };
    const onFinished = (payload: GameFinishResultsPayload) => {
      if (
        payload.roomCode !== roomCode ||
        !Array.isArray(payload.finalLeaderboard) ||
        !Array.isArray(payload.podium)
      ) {
        return;
      }
      finishedRef.current = true;
      setFinalResult(payload);
      setQuestion(null);
      setResults(null);
      setFinishing(false);
      setConfirmFinish(false);
      setNotice(null);
    };

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);
    socket.on("connect_error", onConnectError);
    socket.on("exception", onException);
    socket.on(WsEventNames.ROOM_STATE_SYNC, onSync);
    socket.on(WsEventNames.ROOM_PARTICIPANT_JOINED, onJoined);
    socket.on(WsEventNames.GAME_QUESTION_OPENED, onOpened);
    socket.on(WsEventNames.GAME_QUESTION_RESULTS, onResults);
    socket.on(WsEventNames.GAME_FINISH, onFinished);
    if (socket.connected) {
      onConnect();
    }

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
      socket.off("connect_error", onConnectError);
      socket.off("exception", onException);
      socket.off(WsEventNames.ROOM_STATE_SYNC, onSync);
      socket.off(WsEventNames.ROOM_PARTICIPANT_JOINED, onJoined);
      socket.off(WsEventNames.GAME_QUESTION_OPENED, onOpened);
      socket.off(WsEventNames.GAME_QUESTION_RESULTS, onResults);
      socket.off(WsEventNames.GAME_FINISH, onFinished);
      socketRef.current = null;
      socket.disconnect();
    };
  }, [roomCode, user?.displayName]);

  async function copyLink() {
    try {
      await navigator.clipboard.writeText(link);
      setCopied(true);
    } catch {
      setCopied(false);
      setNotice("No se pudo copiar el enlace. Puedes seleccionarlo manualmente.");
    }
  }

  function openQuestion() {
    if (connection !== "connected" || question || exhausted || openingRef.current) {
      return;
    }
    openingRef.current = true;
    setNotice(null);
    socketRef.current?.emit(WsEventNames.GAME_START_QUESTION, { questionIndex: nextIndex });
  }

  function closeQuestion() {
    if (!question || connection !== "connected") {
      return;
    }
    setNotice(null);
    socketRef.current?.emit(WsEventNames.GAME_CLOSE_QUESTION, { questionIndex: question.questionIndex });
  }

  function requestFinish() {
    if (
      !shouldEmitFinish(confirmFinish, finishing) ||
      !canOfferFinish(exhausted, Boolean(question), Boolean(finalResult)) ||
      connection !== "connected"
    ) {
      return;
    }
    setFinishing(true);
    setNotice(null);
    socketRef.current?.emit(WsEventNames.GAME_FINISH, { roomCode });
  }

  const openImage = question ? questionImageSrc(question.imageUrl, gameApiUrl) : null;

  if (finalResult) {
    return (
      <ArenaFrame kicker="Profesor" title="¡Reto completado!" workspace>
        <MatchFinish
          connected={connection === "connected"}
          result={finalResult}
          returnLabel="Volver al panel"
          returnTo={paths.teacher}
          showHeading={false}
        />
      </ArenaFrame>
    );
  }

  return (
    <ArenaFrame kicker="Profesor" title={question || results ? "Reto en vivo" : "Lobby"} workspace>
      <div className="grid min-h-0 flex-1 gap-4 lg:grid-cols-[minmax(0,1.2fr)_minmax(18rem,24rem)] lg:overflow-hidden">
        <section className="flex min-h-0 flex-col justify-between overflow-y-auto rounded-2xl border border-vx-cyan/30 bg-ink/40 p-5 sm:p-8">
          <div>
            <Link className="text-sm text-vx-cyan hover:text-white" to={paths.teacher}>
              Volver a la mesa
            </Link>
            <p className="mt-4 text-sm uppercase tracking-[0.18em] text-white/50">Cuestionario</p>
            <h3 className="mt-1 text-3xl font-bold sm:text-4xl">{quizTitle}</h3>
            {question ? (
              <article className="mt-8">
                <p className="text-sm uppercase tracking-[0.18em] text-vx-magenta">{questionLabel(question.questionIndex)}</p>
                <h3 className="mt-2 text-3xl font-bold leading-tight sm:text-5xl">{question.statement}</h3>
                {openImage ? <img className="mt-4 max-h-64 rounded-2xl object-contain" src={openImage} alt="" /> : null}
                <p className="mt-6 text-6xl font-bold text-vx-cyan" role="timer">
                  {remainingSeconds(question.expiresAt, now)}s
                </p>
                <p className="mt-2 text-sm text-white/60">La respuesta correcta se revela al cerrar la pregunta.</p>
              </article>
            ) : null}
            {results && !question ? (
              <article className="mt-8">
                <p className="text-sm uppercase tracking-[0.18em] text-vx-magenta">{questionLabel(results.questionIndex)}</p>
                <p className="mt-3 text-2xl font-semibold">
                  Respuesta correcta: {results.correctAnswer ? "Verdadero" : "Falso"}
                </p>
                <p className="mt-3 text-lg text-white/80">
                  {results.trueCount} verdadero · {results.falseCount} falso
                </p>
                <Ranking entries={results.leaderboard} />
              </article>
            ) : null}
            {!question && !results ? (
              <>
                <p className="mt-8 text-sm uppercase tracking-[0.18em] text-vx-magenta">Código de sala</p>
                <p className="mt-2 text-6xl font-bold tracking-[0.16em] text-vx-cyan sm:text-7xl">{roomCode}</p>
              </>
            ) : (
              <p className="mt-6 text-sm uppercase tracking-[0.16em] text-white/45">{roomCode}</p>
            )}
            <p className={`mt-4 text-sm ${connection === "connected" ? "text-vx-cyan" : "text-vx-magenta"}`} role="status">
              WebSocket: {connectionLabel[connection]}
            </p>
            {notice ? (
              <p className="mt-3 text-sm text-vx-magenta" role="alert">
                {notice}
              </p>
            ) : null}
            {exhausted ? (
              <p className="mt-3 text-sm text-white/70">No hay más preguntas. Puedes finalizar la partida.</p>
            ) : null}
          </div>
          <div className="mt-6">
            {question ? (
              <button
                className="w-full rounded-2xl bg-vx-magenta px-4 py-4 text-lg font-semibold text-ink disabled:opacity-50"
                disabled={connection !== "connected"}
                type="button"
                onClick={closeQuestion}
              >
                Cerrar pregunta
              </button>
            ) : canOfferFinish(exhausted, Boolean(question), Boolean(finalResult)) ? (
              confirmFinish ? (
                <div className="rounded-2xl border border-vx-magenta/40 p-4">
                  <p>¿Confirmas finalizar la partida? El resultado se guardará.</p>
                  <div className="mt-3 flex gap-2">
                    <button
                      className="rounded-xl bg-vx-magenta px-4 py-2 font-semibold text-ink disabled:opacity-50"
                      disabled={finishing || connection !== "connected"}
                      type="button"
                      onClick={requestFinish}
                    >
                      {finishing ? "Finalizando…" : "Confirmar finalización"}
                    </button>
                    <button
                      className="rounded-xl border border-white/20 px-4 py-2"
                      disabled={finishing}
                      type="button"
                      onClick={() => setConfirmFinish(false)}
                    >
                      Cancelar
                    </button>
                  </div>
                </div>
              ) : (
                <button
                  className="w-full rounded-2xl border border-vx-magenta px-4 py-4 text-lg font-semibold text-vx-magenta"
                  disabled={connection !== "connected"}
                  type="button"
                  onClick={() => setConfirmFinish(true)}
                >
                  Finalizar partida
                </button>
              )
            ) : (
              <button
                className="w-full rounded-2xl bg-gradient-to-r from-vx-cyan to-vx-magenta px-4 py-4 text-lg font-semibold text-ink disabled:cursor-not-allowed disabled:opacity-40"
                disabled={connection !== "connected" || exhausted}
                type="button"
                onClick={openQuestion}
              >
                {hostActionLabel(nextIndex)}
              </button>
            )}
          </div>
        </section>

        <aside className="flex min-h-0 flex-col gap-4 lg:overflow-hidden">
          <div className="rounded-2xl border border-white/10 bg-white p-4 text-center">
            <QRCodeSVG
              value={link}
              size={220}
              marginSize={2}
              bgColor="#ffffff"
              fgColor="#070910"
              title={`Invitación a la sala ${roomCode}`}
              className="mx-auto"
            />
            <p className="mt-3 break-all text-sm text-ink">{link}</p>
            <button className="mt-3 rounded-xl bg-ink px-4 py-2 text-sm font-semibold text-vx-cyan" type="button" onClick={() => void copyLink()}>
              {copied ? "Enlace copiado" : "Copiar enlace"}
            </button>
          </div>
          <div className="flex min-h-0 flex-1 flex-col rounded-2xl border border-vx-magenta/30 bg-ink/50 p-4 lg:overflow-hidden">
            <p className="text-lg font-semibold text-vx-magenta">
              {players} {players === 1 ? "jugador" : "jugadores"}
            </p>
            <ul className="mt-3 grid content-start gap-2 lg:min-h-0 lg:flex-1 lg:overflow-y-auto">
              {participants.map((participant) => (
                <li className="rounded-xl border border-white/10 px-3 py-2" key={participant.userId}>
                  <span className="block">{visibleParticipantName(participant)}</span>
                  <span className="text-xs uppercase tracking-[0.14em] text-white/45">
                    {participant.role === UserRole.HOST ? "Anfitrión" : "Jugador"}
                  </span>
                </li>
              ))}
            </ul>
            {participants.length === 0 ? <p className="mt-3 text-sm text-white/55">Esperando la lista de la sala.</p> : null}
          </div>
        </aside>
      </div>
    </ArenaFrame>
  );
}

function Ranking({ entries }: { entries: LeaderboardEntry[] }) {
  if (entries.length === 0) {
    return <p className="mt-4 text-sm text-white/60">Todavía no hay jugadores en la clasificación.</p>;
  }
  return (
    <ol className="mt-4 grid gap-2">
      {entries.map((entry) => (
        <li className="flex items-center justify-between rounded-xl border border-white/10 px-3 py-2" key={entry.userId}>
          <span>
            {entry.rank}. {visibleIdentity(entry.displayName) ?? "Participante"}
          </span>
          <span className="text-vx-cyan">{entry.score}</span>
        </li>
      ))}
    </ol>
  );
}

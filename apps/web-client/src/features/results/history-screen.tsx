import { Link } from "react-router-dom";
import { visibleIdentity } from "../../shared/arena-frame";
import { MatchFinish } from "../live/match-finish";
import {
  finishFromDetail,
  formatFinishedAt,
  ownStanding,
  type DetailPresentation,
  type HistoryPresentation,
  type SessionSummary,
} from "./session-history";

export function HistoryScreen({
  presentation,
  audience,
  viewerId,
  detailPath,
}: {
  presentation: HistoryPresentation;
  audience: "host" | "student";
  viewerId?: string;
  detailPath: (roomCode: string) => string;
}) {
  if (presentation.status === "loading") {
    return <p role="status">Cargando historial…</p>;
  }
  if (presentation.status === "error") {
    return (
      <p className="text-vx-magenta" role="alert">
        {presentation.message}
      </p>
    );
  }
  if (presentation.status === "empty") {
    return (
      <p>
        {audience === "host"
          ? "Todavía no hay partidas finalizadas."
          : "Todavía no participas en partidas finalizadas."}
      </p>
    );
  }

  return (
    <ul className="grid gap-3">
      {presentation.sessions.map((session) => (
        <li key={session.roomCode}>
          <SessionRow audience={audience} detailPath={detailPath} session={session} viewerId={viewerId} />
        </li>
      ))}
    </ul>
  );
}

function SessionRow({
  session,
  audience,
  viewerId,
  detailPath,
}: {
  session: SessionSummary;
  audience: "host" | "student";
  viewerId?: string;
  detailPath: (roomCode: string) => string;
}) {
  const mine = viewerId ? ownStanding(session.participants, viewerId) : null;
  return (
    <article className="rounded-2xl border border-white/10 p-4">
      <p className="text-sm uppercase tracking-[0.16em] text-white/50">Código de sala</p>
      <h3 className="text-2xl font-bold tracking-[0.12em] text-vx-cyan">{session.roomCode}</h3>
      <p className="mt-2 text-white/75">{formatFinishedAt(session.finishedAt)}</p>
      <p className="mt-2 text-sm text-white/60">
        {session.participants.length} {session.participants.length === 1 ? "participante" : "participantes"}
      </p>
      {audience === "student" ? (
        mine ? (
          <p className="mt-2 text-vx-cyan">
            Tu posición {mine.rank} · Puntaje {mine.score}
          </p>
        ) : (
          <p className="mt-2 text-white/70">Tu resultado no aparece en la clasificación enviada por el servidor.</p>
        )
      ) : null}
      <ol className="mt-3 grid gap-1">
        {session.participants.map((entry) => (
          <li key={entry.userId}>
            {entry.rank}. {visibleIdentity(entry.displayName) ?? "Participante"} · {entry.score}
          </li>
        ))}
      </ol>
      <Link className="mt-3 inline-block text-vx-cyan" to={detailPath(session.roomCode)}>
        Ver detalle
      </Link>
    </article>
  );
}

export function DetailScreen({
  presentation,
  viewerId,
  returnTo,
  returnLabel,
}: {
  presentation: DetailPresentation;
  viewerId?: string;
  returnTo: string;
  returnLabel: string;
}) {
  if (presentation.status === "loading") {
    return <p role="status">Cargando partida…</p>;
  }
  if (presentation.status === "error") {
    return (
      <div>
        <p className="text-vx-magenta" role="alert">
          {presentation.message}
        </p>
        <Link className="mt-4 inline-block text-vx-cyan" to={returnTo}>
          {returnLabel}
        </Link>
      </div>
    );
  }

  const mine = viewerId ? ownStanding(presentation.detail.participants, viewerId) : null;
  return (
    <div>
      <p className="text-sm text-white/60">{formatFinishedAt(presentation.detail.finishedAt)}</p>
      {viewerId ? (
        mine ? null : (
          <p className="mt-2 text-white/70">Tu resultado no aparece en la clasificación enviada por el servidor.</p>
        )
      ) : null}
      <div className="mt-4">
        <MatchFinish
          highlightUserId={viewerId}
          result={finishFromDetail(presentation.detail)}
          returnLabel={returnLabel}
          returnTo={returnTo}
        />
      </div>
    </div>
  );
}

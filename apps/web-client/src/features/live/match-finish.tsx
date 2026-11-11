import type { GameFinishResultsPayload, PodiumEntry } from "@profelink/shared-dtos";
import { Link } from "react-router-dom";
import { visibleIdentity } from "../../shared/arena-frame";
import { finishView } from "./finish-view";

const placeCopy: Record<PodiumEntry["position"], { label: string; tone: string; height: string; depth: string }> = {
  1: {
    label: "Oro",
    tone: "border-[#f6c453] bg-gradient-to-b from-[#f6c453]/30 to-[#f6c453]/5 text-[#f8e2a0] shadow-[0_0_32px_rgba(246,196,83,0.35)]",
    height: "min-h-48 sm:min-h-56",
    depth: "z-10 sm:[transform:translateZ(28px)]",
  },
  2: {
    label: "Plata",
    tone: "border-[#d5dde6] bg-gradient-to-b from-white/25 to-white/5 text-[#eef3f8] shadow-[0_0_24px_rgba(213,221,230,0.2)]",
    height: "min-h-36 sm:min-h-44",
    depth: "sm:[transform:rotateY(14deg)]",
  },
  3: {
    label: "Bronce",
    tone: "border-[#d4894a] bg-gradient-to-b from-[#d4894a]/30 to-[#d4894a]/5 text-[#f0c09a] shadow-[0_0_24px_rgba(212,137,74,0.25)]",
    height: "min-h-28 sm:min-h-36",
    depth: "sm:[transform:rotateY(-14deg)]",
  },
};

const rankTone: Record<number, string> = {
  1: "border-[#f6c453]/70 bg-[#f6c453]/10",
  2: "border-[#d5dde6]/70 bg-white/5",
  3: "border-[#d4894a]/70 bg-[#d4894a]/10",
};

export function MatchFinish({
  result,
  highlightUserId,
  returnTo,
  returnLabel,
  connected = true,
  showHeading = true,
}: {
  result: GameFinishResultsPayload;
  highlightUserId?: string;
  returnTo: string;
  returnLabel: string;
  connected?: boolean;
  showHeading?: boolean;
}) {
  const view = finishView(result);
  const mine = highlightUserId ? view.ranking.find((entry) => entry.userId === highlightUserId) ?? null : null;

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="shrink-0 text-center">
        {showHeading ? <h3 className="text-3xl font-bold sm:text-4xl">¡Reto completado!</h3> : null}
        <p className="mt-2 text-sm uppercase tracking-[0.22em] text-vx-magenta">Desafía tus conocimientos</p>
        {!connected ? (
          <p className="mt-3 text-sm text-white/70" role="status">
            La conexión se cerró. El resultado de esta pantalla se conserva.
          </p>
        ) : null}
      </div>

      {view.podium.length === 0 ? (
        <p className="mt-8 text-center text-white/70">No hay participantes en el podio.</p>
      ) : (
        <div className="mx-auto mt-6 flex w-full max-w-3xl items-end justify-center gap-2 [perspective:900px] sm:gap-4" role="list">
          {view.podium.map((entry, index) => {
            const place = placeCopy[entry.position];
            return (
              <article
                className={`vx-rise flex w-[31%] max-w-[11rem] flex-col items-center justify-end rounded-t-3xl border px-2 pb-3 pt-4 ${place.tone} ${place.height} ${place.depth}`}
                data-position={entry.position}
                data-testid="podium-place"
                key={entry.userId}
                role="listitem"
                style={{ animationDelay: `${index * 120}ms` }}
              >
                <Trophy position={entry.position} />
                <p className="mt-2 line-clamp-2 text-center text-sm font-semibold text-white sm:text-base">
                  {visibleIdentity(entry.displayName) ?? "Participante"}
                </p>
                <p className="text-2xl font-bold">{entry.score}</p>
                <p className="text-[0.65rem] uppercase tracking-[0.18em]">{place.label}</p>
              </article>
            );
          })}
        </div>
      )}

      <section className="mt-6 flex min-h-0 flex-1 flex-col">
        <h4 className="text-sm uppercase tracking-[0.18em] text-vx-cyan">Clasificación final</h4>
        {highlightUserId ? (
          mine ? (
            <p className="mt-2 text-lg text-vx-cyan">
              Tu posición {mine.rank} · Puntaje {mine.score}
            </p>
          ) : (
            <p className="mt-2 text-white/75">Tu resultado no aparece en la clasificación enviada por el servidor.</p>
          )
        ) : null}
        {view.ranking.length === 0 ? (
          <p className="mt-4 text-white/70">No hay participantes en la clasificación.</p>
        ) : (
          <ol className="mt-3 grid min-h-0 gap-2 overflow-y-auto lg:max-h-64">
            {view.ranking.map((entry) => {
              const self = highlightUserId === entry.userId;
              return (
                <li
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 ${rankTone[entry.rank] ?? "border-white/10"} ${self ? "ring-2 ring-vx-cyan" : ""}`}
                  data-self={self ? "true" : "false"}
                  data-testid="ranking-row"
                  key={entry.userId}
                >
                  <span>
                    {entry.rank}. {visibleIdentity(entry.displayName) ?? "Participante"}
                  </span>
                  <span className="font-semibold text-vx-cyan">{entry.score}</span>
                </li>
              );
            })}
          </ol>
        )}
      </section>

      <Link
        className="mt-5 inline-flex w-full items-center justify-center rounded-2xl border border-vx-cyan px-4 py-3 font-semibold text-vx-cyan hover:bg-vx-cyan hover:text-ink sm:w-auto"
        to={returnTo}
      >
        {returnLabel}
      </Link>
    </div>
  );
}

function Trophy({ position }: { position: PodiumEntry["position"] }) {
  const color = position === 1 ? "#f6c453" : position === 2 ? "#d5dde6" : "#d4894a";
  return (
    <svg aria-hidden="true" className="vx-shine h-10 w-10" viewBox="0 0 48 48">
      <path d="M14 8h20v8a10 10 0 0 1-20 0V8z" fill={color} opacity="0.95" />
      <path d="M14 12H8a6 6 0 0 0 6 8M34 12h6a6 6 0 0 1-6 8" fill="none" stroke={color} strokeWidth="3" />
      <path d="M24 26v6M18 40h12M20 32h8v8h-8z" fill={color} />
    </svg>
  );
}

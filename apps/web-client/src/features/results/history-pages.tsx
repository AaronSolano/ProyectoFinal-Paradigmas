import { useEffect, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { ArenaFrame } from "../../shared/arena-frame";
import { HttpError } from "../../shared/http";
import { paths, studentHistoryPath, teacherHistoryPath } from "../../shared/paths";
import { readStoredToken } from "../../shared/session";
import { useAuth } from "../auth/auth-context";
import { DetailScreen, HistoryScreen } from "./history-screen";
import { fetchFinishedSession, fetchFinishedSessions } from "./session-api";
import { MISSING_SESSION, presentDetail, presentHistory, type SessionDetail, type SessionSummary } from "./session-history";

export function HostHistoryPage() {
  return (
    <HistoryLoader
      audience="host"
      detailPath={teacherHistoryPath}
      title="Historial de partidas"
      backTo={paths.teacher}
      backLabel="Volver a la mesa"
    />
  );
}

export function StudentHistoryPage() {
  return (
    <HistoryLoader
      audience="student"
      detailPath={studentHistoryPath}
      title="Historial de partidas"
      backTo={paths.student}
      backLabel="Volver al inicio"
    />
  );
}

export function HostHistoryDetailPage() {
  return (
    <DetailLoader
      audience="host"
      backTo={paths.teacherHistory}
      backLabel="Volver al historial"
    />
  );
}

export function StudentHistoryDetailPage() {
  return (
    <DetailLoader
      audience="student"
      backTo={paths.studentHistory}
      backLabel="Volver al historial"
    />
  );
}

function HistoryLoader({
  audience,
  detailPath,
  title,
  backTo,
  backLabel,
}: {
  audience: "host" | "student";
  detailPath: (roomCode: string) => string;
  title: string;
  backTo: string;
  backLabel: string;
}) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<SessionSummary[] | null>(null);

  useEffect(() => {
    const token = readStoredToken();
    if (!token) {
      setLoading(false);
      setError("La sesión expiró.");
      return;
    }
    let cancelled = false;
    fetchFinishedSessions(token)
      .then((rows) => {
        if (!cancelled) {
          setSessions(rows);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setError(reason instanceof HttpError ? reason.message : "No se pudo cargar el historial.");
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

  return (
    <ArenaFrame kicker={audience === "host" ? "Profesor" : "Estudiante"} title={title} wide>
      <Link className="text-sm text-vx-cyan" to={backTo}>
        {backLabel}
      </Link>
      <div className="mt-6">
        <HistoryScreen
          audience={audience}
          detailPath={detailPath}
          presentation={presentHistory(loading, error, sessions)}
          viewerId={audience === "student" ? user?.id : undefined}
        />
      </div>
    </ArenaFrame>
  );
}

function DetailLoader({
  audience,
  backTo,
  backLabel,
}: {
  audience: "host" | "student";
  backTo: string;
  backLabel: string;
}) {
  const { roomCode = "" } = useParams();
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [detail, setDetail] = useState<SessionDetail | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    setDetail(null);
    const token = readStoredToken();
    if (!token || !roomCode) {
      setLoading(false);
      setError(MISSING_SESSION);
      setDetail(null);
      return;
    }
    let cancelled = false;
    fetchFinishedSession(token, roomCode)
      .then((row) => {
        if (!cancelled) {
          setDetail(row);
        }
      })
      .catch((reason: unknown) => {
        if (!cancelled) {
          setDetail(null);
          setError(reason instanceof HttpError ? reason.message : MISSING_SESSION);
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
  }, [roomCode]);

  return (
    <ArenaFrame kicker={audience === "host" ? "Profesor" : "Estudiante"} title={roomCode || "Partida"} wide>
      <DetailScreen
        presentation={presentDetail(loading, error, detail)}
        returnLabel={backLabel}
        returnTo={backTo}
        viewerId={audience === "student" ? user?.id : undefined}
      />
    </ArenaFrame>
  );
}

import { useCallback, useEffect, useMemo, useState } from "react";
import { matchManagementService } from "../../services/matchManagementService";
import { matchTrackingService } from "../../services/matchTrackingService";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import { useAuth } from "../../hooks/useAuth";
import { hasApplicationRole } from "../../domain/authorization/roleAccess";
import {
  applyTrackingPosition,
  isTrackingBoard,
  type TrackingConnectionState,
  type TrackingEvent,
} from "../../domain/tracking/trackingBoard";
import type {
  MatchManagement,
  TrackingBoard,
  TrackingPositionUpdate,
} from "../../models/matches";
import TrackingActivity from "../../components/tracking/TrackingActivity";
import TrackingCourt from "../../components/tracking/TrackingCourt";
import TrackingRoster from "../../components/tracking/TrackingRoster";
import Icon from "../../components/icons/Icon";
import {
  EmptyNote,
  Modal,
  NoticeBanner,
  PageHeader,
  Panel,
  type Notice,
} from "../../sports/ui";
import { ghostButtonClass, primaryButtonClass } from "../../sports/format";

const matchStatusLabels: Record<MatchManagement["status"], string> = {
  SCHEDULED: "Programado",
  BETTING_OPEN: "Apuestas abiertas",
  BETTING_CLOSED: "Apuestas cerradas",
  IN_PROGRESS: "En curso",
  FINISHED: "Finalizado",
  CANCELLED: "Cancelado",
};

const connectionLabels: Record<TrackingConnectionState, string> = {
  CONNECTING: "Conectando canal",
  CONNECTED: "Canal conectado",
  RECONNECTING: "Reconectando canal",
  DISCONNECTED: "Canal desconectado",
};

const dateTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

export default function MatchTrackingPage() {
  const { roles } = useAuth();
  const roleNames = roles.map((role) => role.name);
  const canManageTracking = hasApplicationRole(roleNames, "sportsAdmin");
  const [matches, setMatches] = useState<MatchManagement[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [board, setBoard] = useState<TrackingBoard | null>(null);
  const [recentUpdates, setRecentUpdates] = useState<TrackingPositionUpdate[]>([]);
  const [updateCount, setUpdateCount] = useState(0);
  const [connectionState, setConnectionState] = useState<TrackingConnectionState>("DISCONNECTED");
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingBoard, setLoadingBoard] = useState(false);
  const [refreshingBoard, setRefreshingBoard] = useState(false);
  const [starting, setStarting] = useState(false);
  const [stopping, setStopping] = useState(false);
  const [showStopConfirmation, setShowStopConfirmation] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [trackingError, setTrackingError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      const loaded = await matchManagementService.listMatches();
      setMatches(loaded);
      setSelectedMatchId((current) =>
        current && loaded.some((match) => String(match.id) === current)
          ? current
          : String(loaded[0]?.id ?? ""),
      );
      setLoadError(null);
    } catch (error) {
      setLoadError(readSportError(error));
    } finally {
      setLoadingMatches(false);
    }
  }, []);

  useEffect(() => {
    void loadMatches();
  }, [loadMatches]);

  const selectedMatch = useMemo(
    () => matches.find((match) => String(match.id) === selectedMatchId) ?? null,
    [matches, selectedMatchId],
  );

  const applyEvent = useCallback((event: TrackingEvent) => {
    if (isTrackingBoard(event)) {
      setBoard(event);
      return;
    }
    setBoard((current) => current ? applyTrackingPosition(current, event) : current);
    setRecentUpdates((current) => [event, ...current].slice(0, 6));
    setUpdateCount((current) => current + 1);
  }, []);

  useEffect(() => {
    if (!selectedMatchId) {
      setBoard(null);
      setRecentUpdates([]);
      setUpdateCount(0);
      setLoadingBoard(false);
      setConnectionState("DISCONNECTED");
      return;
    }

    const matchId = Number(selectedMatchId);
    let active = true;
    setBoard(null);
    setRecentUpdates([]);
    setUpdateCount(0);
    setLoadingBoard(true);
    setTrackingError(null);
    setConnectionState("CONNECTING");

    const unsubscribe = matchTrackingService.subscribe(
      matchId,
      (event) => {
        if (active) applyEvent(event);
      },
      (state) => {
        if (active) setConnectionState(state);
      },
    );

    void matchTrackingService.getBoard(matchId)
      .then((loadedBoard) => {
        if (active) setBoard(loadedBoard);
      })
      .catch((error: unknown) => {
        if (active) setTrackingError(readSportError(error));
      })
      .finally(() => {
        if (active) setLoadingBoard(false);
      });

    return () => {
      active = false;
      unsubscribe();
    };
  }, [applyEvent, selectedMatchId]);

  const refreshBoard = async () => {
    if (!selectedMatch) return;
    setRefreshingBoard(true);
    setTrackingError(null);
    try {
      setBoard(await matchTrackingService.getBoard(selectedMatch.id));
    } catch (error) {
      setTrackingError(readSportError(error));
    } finally {
      setRefreshingBoard(false);
    }
  };

  const startTracking = async () => {
    if (!selectedMatch) return;
    setStarting(true);
    setTrackingError(null);
    setNotice(null);
    try {
      const startedBoard = await matchTrackingService.start(selectedMatch.id);
      setBoard(startedBoard);
      setNotice({
        tone: "ok",
        message: "Seguimiento iniciado. Las posiciones se actualizarán automáticamente.",
      });
    } catch (error) {
      setTrackingError(readSportError(error));
    } finally {
      setStarting(false);
    }
  };

  const stopTracking = async () => {
    if (!selectedMatch) return;
    setStopping(true);
    setTrackingError(null);
    setNotice(null);
    try {
      const stoppedBoard = await matchTrackingService.stop(selectedMatch.id);
      setBoard(stoppedBoard);
      setShowStopConfirmation(false);
      setNotice({
        tone: "ok",
        message: "Seguimiento finalizado. El partido y el historial de posiciones se conservaron.",
      });
    } catch (error) {
      setTrackingError(readSportError(error));
    } finally {
      setStopping(false);
    }
  };

  const matchIsTerminal =
    selectedMatch?.status === "FINISHED" || selectedMatch?.status === "CANCELLED";
  const socketState = selectedMatch ? connectionState : "DISCONNECTED";
  const monitoredPlayers = board?.teams.reduce((total, team) => total + team.players.length, 0) ?? 0;

  return (
    <div>
      <PageHeader
        icon={<Icon name="stadium" className="h-5 w-5" />}
        title="Seguimiento deportivo"
        subtitle="Visualiza en tiempo real la ubicación de los jugadores y la pelota."
        actions={
          <button
            type="button"
            onClick={() => {
              setLoadingMatches(true);
              setLoadError(null);
              void loadMatches();
            }}
            disabled={loadingMatches}
            className="rounded-lg border border-white/10 px-4 py-2 text-sm font-bold text-slate-200 transition hover:border-[#3dff7a]/40 disabled:opacity-50"
          >
            {loadingMatches ? "Actualizando…" : "Actualizar partidos"}
          </button>
        }
      />
      {loadError && (
        <NoticeBanner
          notice={{ tone: "error", message: loadError }}
          onClose={() => setLoadError(null)}
        />
      )}
      {trackingError && (
        <NoticeBanner
          notice={{ tone: "error", message: trackingError }}
          onClose={() => setTrackingError(null)}
        />
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      <Panel title="Seleccionar partido" className="mb-5">
        {loadingMatches && matches.length === 0 ? (
          <EmptyNote>Cargando partidos…</EmptyNote>
        ) : matches.length === 0 ? (
          <EmptyNote>No hay partidos registrados para seguimiento.</EmptyNote>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-xs font-semibold text-slate-300">
              Partido
              <select
                value={selectedMatchId}
                onChange={(event) => {
                  setSelectedMatchId(event.target.value);
                  setNotice(null);
                }}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white"
              >
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.homeTeam} vs {match.awayTeam}
                  </option>
                ))}
              </select>
            </label>
            {selectedMatch && (
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-slate-300">
                  {matchStatusLabels[selectedMatch.status]}
                </span>
                <span
                  className={`rounded-lg border px-3 py-2.5 text-xs font-bold ${
                    socketState === "CONNECTED"
                      ? "border-emerald-400/30 bg-emerald-400/10 text-emerald-200"
                      : "border-amber-300/30 bg-amber-300/10 text-amber-100"
                  }`}
                >
                  {connectionLabels[socketState]}
                </span>
              </div>
            )}
          </div>
        )}
      </Panel>

      {selectedMatch && (
        <>
          <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-xl font-black text-white">
                {selectedMatch.homeTeam} <span className="text-slate-500">vs</span> {selectedMatch.awayTeam}
              </h2>
              <p className="mt-1 text-sm text-slate-400">
                {dateTime.format(new Date(selectedMatch.startsAt))}
                {board ? ` · ${board.sportName}` : ""}
              </p>
            </div>
            <button
              type="button"
              onClick={() => void refreshBoard()}
              disabled={refreshingBoard || loadingBoard}
              className={ghostButtonClass}
            >
              {refreshingBoard ? "Actualizando…" : "Actualizar posiciones"}
            </button>
          </div>

          {loadingBoard ? (
            <Panel><EmptyNote>Consultando estado del seguimiento…</EmptyNote></Panel>
          ) : !board ? (
            <Panel title="Seguimiento del partido">
              <div className="space-y-4 p-4">
                <p className="text-sm text-slate-300">
                  {canManageTracking
                    ? "El seguimiento aún no se ha iniciado para este partido."
                    : "El seguimiento todavía no está activo. Cuando el administrador deportivo lo inicie, las posiciones aparecerán aquí."}
                </p>
                {canManageTracking && matchIsTerminal ? (
                  <p className="text-xs text-amber-200">
                    No se puede iniciar el seguimiento de un partido finalizado o cancelado.
                  </p>
                ) : canManageTracking ? (
                  <button
                    type="button"
                    onClick={() => void startTracking()}
                    disabled={starting}
                    className={primaryButtonClass}
                  >
                    {starting ? "Iniciando…" : "Iniciar seguimiento"}
                  </button>
                ) : null}
              </div>
            </Panel>
          ) : (
            <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1.7fr)_minmax(300px,.8fr)]">
              <div className="space-y-4">
                <Panel
                  title={`Pizarra · ${board.sportName}`}
                  extra={
                    <span
                      className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${
                        board.status === "RUNNING"
                          ? "bg-emerald-400/15 text-emerald-200"
                          : "bg-slate-500/20 text-slate-300"
                      }`}
                    >
                      {board.status === "RUNNING" ? "Seguimiento activo" : "Seguimiento finalizado"}
                    </span>
                  }
                >
                  <div className="p-3 sm:p-4">
                    <TrackingCourt board={board} />
                  </div>
                </Panel>

                <div className="grid grid-cols-3 gap-3">
                  <StatPanel label="Actualizaciones recibidas" value={updateCount.toLocaleString("es-CO")} />
                  <StatPanel label="Jugadores monitoreados" value={monitoredPlayers.toString()} />
                  <StatPanel label="Pelota monitoreada" value={board.ball.name} active={board.status === "RUNNING"} />
                </div>
                <TrackingRoster board={board} />
              </div>

              <div className="space-y-4">
                <Panel title="Detalle del seguimiento">
                  <div className="space-y-4 p-4">
                    <div className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 text-center">
                      <div className="min-w-0">
                        <span
                          className="mx-auto mb-2 block h-3 w-3 rounded-full"
                          style={{ backgroundColor: board.teams[0]?.color ?? "#22c55e" }}
                        />
                        <p className="truncate text-sm font-bold text-white">{board.teams[0]?.teamName ?? selectedMatch.homeTeam}</p>
                        <p className="text-[10px] text-slate-400">Local · {board.teams[0]?.players.length ?? 0} jugadores</p>
                      </div>
                      <span className="text-xs font-black text-slate-500">VS</span>
                      <div className="min-w-0">
                        <span
                          className="mx-auto mb-2 block h-3 w-3 rounded-full"
                          style={{ backgroundColor: board.teams[1]?.color ?? "#3b82f6" }}
                        />
                        <p className="truncate text-sm font-bold text-white">{board.teams[1]?.teamName ?? selectedMatch.awayTeam}</p>
                        <p className="text-[10px] text-slate-400">Visitante · {board.teams[1]?.players.length ?? 0} jugadores</p>
                      </div>
                    </div>
                    <dl className="space-y-2 border-t border-white/5 pt-3 text-xs">
                      <InfoRow label="Deporte" value={board.sportName} />
                      <InfoRow label="Dimensiones" value={`${board.field.width} × ${board.field.height}`} />
                      <InfoRow label="Pelota" value={board.ball.name} />
                      <InfoRow label="Estado del partido" value={matchStatusLabels[selectedMatch.status]} />
                    </dl>
                    {board.status === "RUNNING" && connectionState !== "CONNECTED" && (
                      <p className="rounded-lg border border-amber-300/30 bg-amber-300/10 px-3 py-2 text-xs leading-5 text-amber-100">
                        La pizarra conserva la última posición recibida. Se actualizará al restablecer la conexión.
                      </p>
                    )}
                  </div>
                </Panel>

                <Panel title="Controles del seguimiento">
                  <div className="space-y-3 p-4">
                    {board.status === "RUNNING" ? (
                      canManageTracking ? (
                        <button
                          type="button"
                          onClick={() => setShowStopConfirmation(true)}
                          disabled={stopping}
                          className="w-full rounded-lg border border-red-400/40 bg-red-400/10 px-4 py-2.5 text-sm font-bold text-red-200 transition hover:bg-red-400/20 disabled:opacity-50"
                        >
                          Finalizar seguimiento
                        </button>
                      ) : (
                        <p className="rounded-lg border border-emerald-400/20 bg-emerald-400/5 px-3 py-2 text-center text-sm font-semibold text-emerald-200">
                          Seguimiento en vivo activo
                        </p>
                      )
                    ) : (
                      <p className="rounded-lg border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-sm text-slate-300">
                        El seguimiento está detenido y su historial fue conservado.
                      </p>
                    )}
                    <p className="text-xs leading-5 text-slate-400">
                      Las posiciones se simulan y publican automáticamente. Finalizar no elimina el partido, sus jugadores ni las posiciones registradas.
                    </p>
                  </div>
                </Panel>
                <TrackingActivity board={board} updates={recentUpdates} />
              </div>
            </div>
          )}
        </>
      )}

      {showStopConfirmation && (
        <Modal title="Finalizar seguimiento" onClose={() => setShowStopConfirmation(false)}>
          <p className="text-sm leading-6 text-slate-300">
            Se detendrán las actualizaciones en vivo. El partido, los jugadores y el historial de posiciones permanecerán guardados.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setShowStopConfirmation(false)}
              className={ghostButtonClass}
              disabled={stopping}
            >
              Continuar seguimiento
            </button>
            <button
              type="button"
              onClick={() => void stopTracking()}
              className={primaryButtonClass}
              disabled={stopping}
            >
              {stopping ? "Finalizando…" : "Finalizar"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

function StatPanel({ label, value, active = false }: { label: string; value: string; active?: boolean }) {
  return (
    <Panel>
      <div className="min-w-0 p-3 sm:p-4">
        <p className="text-[10px] font-semibold text-slate-400 sm:text-xs">{label}</p>
        <p className={`mt-2 truncate text-lg font-black sm:text-xl ${active ? "text-emerald-300" : "text-white"}`}>
          {value}
        </p>
      </div>
    </Panel>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-slate-400">{label}</dt>
      <dd className="truncate text-right font-semibold text-slate-200">{value}</dd>
    </div>
  );
}

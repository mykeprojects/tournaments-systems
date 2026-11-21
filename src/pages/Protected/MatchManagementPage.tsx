import { useCallback, useEffect, useMemo, useState } from "react";
import MatchAnnotations from "../../components/matches/MatchAnnotations";
import Icon from "../../components/icons/Icon";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import type {
  MatchAnnotation,
  MatchManagement,
  MatchParticipantPlayer,
} from "../../models/matches";
import { matchManagementService, type MatchAnnotationInput } from "../../services/matchManagementService";
import { EmptyNote, Modal, NoticeBanner, PageHeader, Panel, type Notice } from "../../sports/ui";
import { ghostButtonClass, primaryButtonClass } from "../../sports/format";

const dateTime = new Intl.DateTimeFormat("es-CO", {
  dateStyle: "medium",
  timeStyle: "short",
});

function orderedAnnotations(items: MatchAnnotation[]): MatchAnnotation[] {
  return [...items].sort(
    (left, right) =>
      (left.minute ?? Number.MAX_SAFE_INTEGER) - (right.minute ?? Number.MAX_SAFE_INTEGER) ||
      left.id - right.id,
  );
}

export default function MatchManagementPage() {
  const [matches, setMatches] = useState<MatchManagement[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [annotations, setAnnotations] = useState<MatchAnnotation[]>([]);
  const [homePlayers, setHomePlayers] = useState<MatchParticipantPlayer[]>([]);
  const [awayPlayers, setAwayPlayers] = useState<MatchParticipantPlayer[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [annotationToDelete, setAnnotationToDelete] = useState<MatchAnnotation | null>(null);
  const [viewMode, setViewMode] = useState<"manage" | "finished">("manage");
  const [matchAction, setMatchAction] = useState<"start" | "finish" | null>(null);
  const [partialScores, setPartialScores] = useState<Record<number, { home: number; away: number }>>({});

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

  useEffect(() => {
    if (matches.length === 0) return;

    let active = true;
    Promise.all(
      matches.map(async (match) => {
        try {
          const items = await matchManagementService.listAnnotations(match.id);
          return {
            id: match.id,
            home: items.filter((item) => item.teamId === match.homeTeamId).length,
            away: items.filter((item) => item.teamId === match.awayTeamId).length,
          };
        } catch {
          return { id: match.id, home: 0, away: 0 };
        }
      }),
    ).then((scores) => {
      if (!active) return;
      setPartialScores(Object.fromEntries(
        scores.map((score) => [score.id, { home: score.home, away: score.away }]),
      ));
    });

    return () => {
      active = false;
    };
  }, [matches]);

  const finishedMatches = useMemo(
    () => matches.filter((match) => match.status === "FINISHED"),
    [matches],
  );
  const managementMatches = useMemo(
    () => matches.filter((match) => match.status !== "FINISHED" && match.status !== "CANCELLED"),
    [matches],
  );
  const selectedMatch = useMemo(
    () =>
      (viewMode === "finished" ? finishedMatches : managementMatches).find(
        (match) => String(match.id) === selectedMatchId,
      ) ?? null,
    [finishedMatches, managementMatches, selectedMatchId, viewMode],
  );

  useEffect(() => {
    if (viewMode !== "finished") return;
    if (!finishedMatches.some((match) => String(match.id) === selectedMatchId)) {
      setSelectedMatchId(String(finishedMatches[0]?.id ?? ""));
    }
  }, [finishedMatches, selectedMatchId, viewMode]);

  useEffect(() => {
    if (viewMode !== "manage") return;
    if (!managementMatches.some((match) => String(match.id) === selectedMatchId)) {
      setSelectedMatchId(String(managementMatches[0]?.id ?? ""));
    }
  }, [managementMatches, selectedMatchId, viewMode]);

  const refreshPartialScore = useCallback(async (matchId: number) => {
    const match = matches.find((item) => item.id === matchId);
    if (!match) return;
    try {
      const items = await matchManagementService.listAnnotations(matchId);
      setPartialScores((current) => ({
        ...current,
        [matchId]: {
          home: items.filter((item) => item.teamId === match.homeTeamId).length,
          away: items.filter((item) => item.teamId === match.awayTeamId).length,
        },
      }));
    } catch {
      // Keep the last known score if annotations cannot be refreshed.
    }
  }, [matches]);

  useEffect(() => {
    if (!selectedMatch) {
      setAnnotations([]);
      setHomePlayers([]);
      setAwayPlayers([]);
      setLoadingDetails(false);
      setDetailsError(null);
      return;
    }

    let active = true;
    setAnnotations([]);
    setHomePlayers([]);
    setAwayPlayers([]);
    setLoadingDetails(true);
    setDetailsError(null);
    Promise.all([
      matchManagementService.listAnnotations(selectedMatch.id),
      matchManagementService.listPlayersByTeam(selectedMatch.homeTeamId),
      matchManagementService.listPlayersByTeam(selectedMatch.awayTeamId),
    ])
      .then(([loadedAnnotations, homePlayers, awayPlayers]) => {
        if (!active) return;
        setAnnotations(orderedAnnotations(loadedAnnotations));
        setHomePlayers([...homePlayers].sort((left, right) => left.fullName.localeCompare(right.fullName, "es")));
        setAwayPlayers([...awayPlayers].sort((left, right) => left.fullName.localeCompare(right.fullName, "es")));
      })
      .catch((error: unknown) => {
        if (active) setDetailsError(readSportError(error));
      })
      .finally(() => {
        if (active) setLoadingDetails(false);
      });

    return () => {
      active = false;
    };
  }, [selectedMatch]);

  const createAnnotation = async (input: MatchAnnotationInput): Promise<boolean> => {
    if (!selectedMatch) return false;
    setAnnotationSaving(true);
    setNotice(null);
    try {
      const created = await matchManagementService.createAnnotation(selectedMatch.id, input);
      setAnnotations((current) => orderedAnnotations([...current, created]));
      await refreshPartialScore(selectedMatch.id);
      setNotice({ tone: "ok", message: "La anotación fue registrada." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
      return false;
    } finally {
      setAnnotationSaving(false);
    }
  };

  const updateAnnotation = async (id: number, input: MatchAnnotationInput): Promise<boolean> => {
    if (!selectedMatch) return false;
    setAnnotationSaving(true);
    setNotice(null);
    try {
      const updated = await matchManagementService.updateAnnotation(selectedMatch.id, id, input);
      setAnnotations((current) =>
        orderedAnnotations(current.map((annotation) => (annotation.id === id ? updated : annotation))),
      );
      await refreshPartialScore(selectedMatch.id);
      setNotice({ tone: "ok", message: "La anotación fue actualizada." });
      return true;
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
      return false;
    } finally {
      setAnnotationSaving(false);
    }
  };

  const deleteAnnotation = async () => {
    if (!selectedMatch || !annotationToDelete) return;
    setDeletingId(annotationToDelete.id);
    setNotice(null);
    try {
      await matchManagementService.removeAnnotation(selectedMatch.id, annotationToDelete.id);
      setAnnotations((current) => current.filter((annotation) => annotation.id !== annotationToDelete.id));
      await refreshPartialScore(selectedMatch.id);
      setNotice({ tone: "ok", message: "La anotación fue eliminada. El jugador y el partido se conservaron." });
      setAnnotationToDelete(null);
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setDeletingId(null);
    }
  };

  const startMatch = async () => {
    if (!selectedMatch) return;
    setMatchAction("start");
    setNotice(null);
    try {
      const updated = await matchManagementService.startMatch(selectedMatch.id);
      setMatches((current) => current.map((match) => (match.id === updated.id ? updated : match)));
      setNotice({ tone: "ok", message: "El partido fue iniciado. Ya se pueden registrar anotaciones." });
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setMatchAction(null);
    }
  };

  const finishMatch = async () => {
    if (!selectedMatch) return;
    setMatchAction("finish");
    setNotice(null);
    try {
      const updated = await matchManagementService.finishMatch(selectedMatch.id);
      setMatches((current) => current.map((match) => (match.id === updated.id ? updated : match)));
      await refreshPartialScore(selectedMatch.id);
      setNotice({ tone: "ok", message: "El partido fue finalizado y el ganador se calculó a partir de las anotaciones." });
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setMatchAction(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Icon name="stadium" className="h-5 w-5" />}
        title="Resultados y anotaciones"
        subtitle="Administra las anotaciones y determina el resultado del partido."
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
            {loadingMatches ? "Actualizando…" : "Actualizar"}
          </button>
        }
      />
      {loadError && (
        <NoticeBanner
          notice={{ tone: "error", message: loadError }}
          onClose={() => setLoadError(null)}
        />
      )}
      {detailsError && (
        <NoticeBanner
          notice={{ tone: "error", message: detailsError }}
          onClose={() => setDetailsError(null)}
        />
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      <div className="mb-4 flex gap-2">
        <button type="button" onClick={() => setViewMode("manage")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${viewMode === "manage" ? "bg-[#3dff7a] text-[#04210f]" : "border border-white/10 text-slate-300"}`}>
          Gestionar partidos
        </button>
        <button type="button" onClick={() => setViewMode("finished")}
          className={`rounded-lg px-4 py-2 text-sm font-bold ${viewMode === "finished" ? "bg-[#3dff7a] text-[#04210f]" : "border border-white/10 text-slate-300"}`}>
          Partidos finalizados
        </button>
      </div>

      <Panel title="Seleccionar partido" className="mb-5">
        {loadingMatches && matches.length === 0 ? (
          <EmptyNote>Cargando partidos…</EmptyNote>
        ) : matches.length === 0 ? (
          <EmptyNote>No hay partidos registrados.</EmptyNote>
        ) : viewMode === "finished" && finishedMatches.length === 0 ? (
          <EmptyNote>No hay partidos finalizados todavía.</EmptyNote>
        ) : (
          <div className="grid gap-4 p-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
            <label className="block text-xs font-semibold text-slate-300">
              Partido
              <select
                value={selectedMatchId}
                onChange={(event) => {
                  setSelectedMatchId(event.target.value);
                  setAnnotationToDelete(null);
                  setNotice(null);
                }}
                className="mt-1 w-full rounded-lg border border-white/10 bg-[#071321] px-3 py-2.5 text-sm text-white"
              >
                {(viewMode === "finished" ? finishedMatches : managementMatches).map((match) => (
                  <option key={match.id} value={match.id}>
                    {viewMode === "finished"
                      ? `${match.homeTeam} ${partialScores[match.id]?.home ?? 0} - ${partialScores[match.id]?.away ?? 0} ${match.awayTeam} · Final`
                      : `${match.homeTeam} ${partialScores[match.id]?.home ?? 0} - ${partialScores[match.id]?.away ?? 0} ${match.awayTeam}`}
                  </option>
                ))}
              </select>
            </label>
            {selectedMatch && (
              <span className="rounded-lg border border-white/10 px-3 py-2.5 text-xs text-slate-300">
                {selectedMatch.status.replaceAll("_", " ")}
                {" · "}
                {dateTime.format(new Date(selectedMatch.startsAt))}
              </span>
            )}
          </div>
        )}
      </Panel>

      {selectedMatch && (
        <>
          <div className="mb-4">
            <h2 className="text-lg font-bold text-white">
              {selectedMatch.homeTeam}
              <span className="mx-3 text-[#3dff7a]">
                {partialScores[selectedMatch.id]?.home ?? 0}
                {" - "}
                {partialScores[selectedMatch.id]?.away ?? 0}
              </span>
              {selectedMatch.awayTeam}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Las anotaciones solo pueden asociarse a jugadores con plantilla activa en uno de estos equipos.
            </p>
          </div>
          {viewMode === "manage" && (
            <div className="mb-5 flex flex-wrap gap-3">
              {selectedMatch.status !== "IN_PROGRESS" && selectedMatch.status !== "FINISHED" && selectedMatch.status !== "CANCELLED" && (
                <button type="button" onClick={() => void startMatch()} disabled={matchAction !== null} className={primaryButtonClass}>
                  {matchAction === "start" ? "Iniciando…" : "Iniciar partido"}
                </button>
              )}
              {selectedMatch.status === "IN_PROGRESS" && (
                <button type="button" onClick={() => void finishMatch()} disabled={matchAction !== null} className={ghostButtonClass}>
                  {matchAction === "finish" ? "Finalizando…" : "Finalizar partido"}
                </button>
              )}
            </div>
          )}
          {loadingDetails ? (
            <Panel title="Anotaciones del partido">
              <EmptyNote>Cargando anotaciones y jugadores participantes…</EmptyNote>
            </Panel>
          ) : detailsError ? (
            <Panel title="Anotaciones del partido">
              <EmptyNote>No se pudieron cargar las anotaciones o jugadores. Actualiza para intentarlo de nuevo.</EmptyNote>
            </Panel>
          ) : (
            <MatchAnnotations
              annotations={annotations}
              homeTeam={{ id: selectedMatch.homeTeamId, name: selectedMatch.homeTeam, players: homePlayers }}
              awayTeam={{ id: selectedMatch.awayTeamId, name: selectedMatch.awayTeam, players: awayPlayers }}
              disabled={selectedMatch.status !== "IN_PROGRESS"}
              saving={annotationSaving}
              deletingId={deletingId}
              onCreate={(input) => createAnnotation(input)}
              onUpdate={(id, input) => updateAnnotation(id, input)}
              onDelete={setAnnotationToDelete}
            />
          )}
        </>
      )}

      {annotationToDelete && (
        <Modal title="Eliminar anotación" onClose={() => setAnnotationToDelete(null)}>
          <p className="text-sm leading-6 text-slate-300">
            ¿Eliminar esta anotación? La acción no eliminará al jugador ni al partido asociado.
          </p>
          <div className="mt-5 flex justify-end gap-3">
            <button
              type="button"
              onClick={() => setAnnotationToDelete(null)}
              className={ghostButtonClass}
              disabled={deletingId !== null}
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void deleteAnnotation()}
              className={primaryButtonClass}
              disabled={deletingId !== null}
            >
              {deletingId === annotationToDelete.id ? "Eliminando…" : "Eliminar anotación"}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

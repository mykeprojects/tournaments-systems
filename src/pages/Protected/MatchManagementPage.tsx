import { useCallback, useEffect, useMemo, useState } from "react";
import MatchAnnotations from "../../components/matches/MatchAnnotations";
import MatchResultForm from "../../components/matches/MatchResultForm";
import Icon from "../../components/icons/Icon";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import type { OfficialResult } from "../../models/betting";
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
  const [players, setPlayers] = useState<MatchParticipantPlayer[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingDetails, setLoadingDetails] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const [resultSubmitting, setResultSubmitting] = useState(false);
  const [annotationSaving, setAnnotationSaving] = useState(false);
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const [annotationToDelete, setAnnotationToDelete] = useState<MatchAnnotation | null>(null);

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

  useEffect(() => {
    if (!selectedMatch) {
      setAnnotations([]);
      setPlayers([]);
      setLoadingDetails(false);
      setDetailsError(null);
      return;
    }

    let active = true;
    setAnnotations([]);
    setPlayers([]);
    setLoadingDetails(true);
    setDetailsError(null);
    Promise.all([
      matchManagementService.listAnnotations(selectedMatch.id),
      matchManagementService.listPlayersByTeam(selectedMatch.homeTeamId),
      matchManagementService.listPlayersByTeam(selectedMatch.awayTeamId),
    ])
      .then(([loadedAnnotations, homePlayers, awayPlayers]) => {
        if (!active) return;
        const participants = new Map<number, MatchParticipantPlayer>();
        for (const player of [...homePlayers, ...awayPlayers]) {
          participants.set(player.id, player);
        }
        setAnnotations(orderedAnnotations(loadedAnnotations));
        setPlayers([...participants.values()].sort((left, right) => left.fullName.localeCompare(right.fullName, "es")));
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

  const registerResult = async (result: OfficialResult) => {
    if (!selectedMatch) return;
    setResultSubmitting(true);
    setNotice(null);
    try {
      const updated = await matchManagementService.registerResult(selectedMatch.id, result);
      setMatches((current) => current.map((match) => (match.id === updated.id ? updated : match)));
      setNotice({ tone: "ok", message: "El resultado del partido fue actualizado." });
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setResultSubmitting(false);
    }
  };

  const createAnnotation = async (input: MatchAnnotationInput): Promise<boolean> => {
    if (!selectedMatch) return false;
    setAnnotationSaving(true);
    setNotice(null);
    try {
      const created = await matchManagementService.createAnnotation(selectedMatch.id, input);
      setAnnotations((current) => orderedAnnotations([...current, created]));
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
      setNotice({ tone: "ok", message: "La anotación fue eliminada. El jugador y el partido se conservaron." });
      setAnnotationToDelete(null);
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setDeletingId(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<Icon name="stadium" className="h-5 w-5" />}
        title="Resultados y anotaciones"
        subtitle="Administra el resultado oficial y los acontecimientos de cada partido."
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

      <Panel title="Seleccionar partido" className="mb-5">
        {loadingMatches && matches.length === 0 ? (
          <EmptyNote>Cargando partidos…</EmptyNote>
        ) : matches.length === 0 ? (
          <EmptyNote>No hay partidos registrados.</EmptyNote>
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
                {matches.map((match) => (
                  <option key={match.id} value={match.id}>
                    {match.homeTeam} vs {match.awayTeam}
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
              {selectedMatch.homeTeam} <span className="text-slate-500">vs</span> {selectedMatch.awayTeam}
            </h2>
            <p className="mt-1 text-sm text-slate-400">
              Las anotaciones solo pueden asociarse a jugadores con plantilla activa en uno de estos equipos.
            </p>
          </div>
          <div className="mb-5">
            <MatchResultForm
              key={selectedMatch.id}
              match={selectedMatch}
              submitting={resultSubmitting}
              onSubmit={(result) => void registerResult(result)}
            />
          </div>
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
              players={players}
              disabled={selectedMatch.status === "CANCELLED"}
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

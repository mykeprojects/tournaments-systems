import { useCallback, useEffect, useState } from "react";
import BetsTable from "../../components/betting/BetsTable";
import Icon from "../../components/icons/Icon";
import { readSportError } from "../../infrastructure/backend/SportHttpClient";
import { bettingService } from "../../services/bettingService";
import type { Bet, Match } from "../../models/betting";
import { EmptyNote, NoticeBanner, PageHeader, Panel } from "../../sports/ui";

export default function SportsAdminBetsPage() {
  const [matches, setMatches] = useState<Match[]>([]);
  const [selectedMatchId, setSelectedMatchId] = useState("");
  const [bets, setBets] = useState<Bet[]>([]);
  const [loadingMatches, setLoadingMatches] = useState(true);
  const [loadingBets, setLoadingBets] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);

  const loadMatches = useCallback(async () => {
    try {
      const loadedMatches = await bettingService.listMatches();
      setMatches(loadedMatches);
      setLoadingBets(loadedMatches.length > 0);
      if (loadedMatches.length === 0) setBets([]);
      setSelectedMatchId((current) =>
        current && loadedMatches.some((match) => String(match.id) === current)
          ? current
          : String(loadedMatches[0]?.id ?? "")
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
    if (!selectedMatchId) {
      return;
    }
    let active = true;
    bettingService.listBetsByMatch(Number(selectedMatchId))
      .then((loadedBets) => {
        if (active) setBets(loadedBets);
      })
      .catch((error: unknown) => {
        if (active) setLoadError(readSportError(error));
      })
      .finally(() => {
        if (active) setLoadingBets(false);
      });
    return () => {
      active = false;
    };
  }, [selectedMatchId]);

  const selectedMatch = matches.find((match) => String(match.id) === selectedMatchId);

  return (
    <div>
      <PageHeader
        icon={<Icon name="chart" className="h-5 w-5" />}
        title="Apuestas por partido"
        subtitle="Consulta las apuestas registradas en los encuentros del sistema."
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
        <NoticeBanner notice={{ tone: "error", message: loadError }} onClose={() => setLoadError(null)} />
      )}
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
                  setBets([]);
                  setLoadingBets(true);
                  setLoadError(null);
                  setSelectedMatchId(event.target.value);
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
                {selectedMatch.status === "FINISHED"
                  ? `Finalizado · Resultado: ${selectedMatch.officialResult ?? "Pendiente"}`
                  : selectedMatch.status.replaceAll("_", " ")}
              </span>
            )}
          </div>
        )}
      </Panel>

      <div className="mb-3">
        <h2 className="text-lg font-bold text-white">
          {selectedMatch ? `${selectedMatch.homeTeam} vs ${selectedMatch.awayTeam}` : "Apuestas registradas"}
        </h2>
        <p className="mt-1 text-sm text-slate-400">Vista de solo consulta para el administrador deportivo.</p>
      </div>
      {loadingBets
        ? <Panel><EmptyNote>Cargando apuestas del partido…</EmptyNote></Panel>
        : <BetsTable bets={bets} showFan />}
    </div>
  );
}

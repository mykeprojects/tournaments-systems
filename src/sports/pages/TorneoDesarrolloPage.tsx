import { useEffect, useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { formatDate } from "../format";
import { TrophyIcon } from "../glyphs";
import {
  developmentError,
  getTournamentDevelopment,
  type DevelopmentPhase,
  type GroupStandings,
  type KnockoutRound,
  type TournamentDevelopment,
} from "../tournamentDevelopmentApi";
import { TOURNAMENT_STATUS_LABEL } from "../tournamentApi";
import { EmptyNote, NoticeBanner, PageHeader, Panel, type Notice } from "../ui";

const PHASE_TYPE_LABEL: Record<DevelopmentPhase["phaseType"], string> = {
  GROUPS: "Fase de grupos",
  KNOCKOUT: "Fase eliminatoria",
};

const PHASE_STATUS_LABEL: Record<DevelopmentPhase["status"], string> = {
  PLANNED: "Programada",
  IN_PROGRESS: "En progreso",
  FINISHED: "Finalizada",
  CANCELLED: "Cancelada",
};

const RESULT_LABEL: Record<string, string> = {
  HOME: "Victoria local",
  AWAY: "Victoria visitante",
  DRAW: "Empate",
  VOID: "Anulado",
};

const TEAM_PLACEHOLDER = "Por definir";

function GroupTable({ group }: { group: GroupStandings }) {
  return (
    <Panel title={group.name} className="overflow-hidden">
      {group.standings.length === 0 ? (
        <EmptyNote>No hay equipos asignados a este grupo.</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Pos</th>
                <th className="px-3 py-3 font-semibold">Equipo</th>
                <th className="px-3 py-3 font-semibold">PJ</th>
                <th className="px-3 py-3 font-semibold">G</th>
                <th className="px-3 py-3 font-semibold">E</th>
                <th className="px-3 py-3 font-semibold">P</th>
                <th className="px-3 py-3 font-semibold">GF</th>
                <th className="px-3 py-3 font-semibold">GC</th>
                <th className="px-3 py-3 font-semibold">DG</th>
                <th className="px-3 py-3 font-semibold">Pts</th>
              </tr>
            </thead>
            <tbody>
              {group.standings.map((row) => (
                <tr key={row.team.id} className="border-t border-white/5">
                  <td className="px-4 py-3 font-bold text-[#3dff7a]">{row.position}</td>
                  <td className="px-3 py-3 font-semibold text-white">{row.team.name}</td>
                  <td className="px-3 py-3 text-slate-300">{row.played}</td>
                  <td className="px-3 py-3 text-slate-300">{row.won}</td>
                  <td className="px-3 py-3 text-slate-300">{row.drawn}</td>
                  <td className="px-3 py-3 text-slate-300">{row.lost}</td>
                  <td className="px-3 py-3 text-slate-300">{row.goalsFor}</td>
                  <td className="px-3 py-3 text-slate-300">{row.goalsAgainst}</td>
                  <td className="px-3 py-3 text-slate-300">{row.goalDifference}</td>
                  <td className="px-3 py-3 font-bold text-white">{row.points}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      {group.standings.length > 0 && group.standings.every((row) => row.played === 0) && (
        <p className="border-t border-white/5 px-4 py-3 text-xs text-slate-400">
          Tabla inicial sin partidos finalizados.
        </p>
      )}
    </Panel>
  );
}

function KnockoutView({ rounds }: { rounds: KnockoutRound[] }) {
  if (rounds.length === 0) {
    return <EmptyNote>No hay llaves registradas para esta fase.</EmptyNote>;
  }

  return (
    <div className="space-y-4">
      {rounds.map((round) => (
        <Panel key={round.roundType} title={round.label}>
          <div className="grid gap-3 p-4 md:grid-cols-2 xl:grid-cols-3">
            {round.matchups.map((matchup) => (
              <article
                key={matchup.bracketId}
                className="rounded-xl border border-[#245078] bg-[#06101c] p-4"
              >
                <div className="mb-3 flex items-center justify-between text-xs text-slate-400">
                  <span className="font-bold">Cruce {matchup.bracketOrder}</span>
                  <span className="rounded-full bg-white/5 px-2 py-0.5 font-semibold text-slate-300">
                    {matchup.status}
                  </span>
                </div>
                <div className="space-y-2">
                  {[matchup.teamA, matchup.teamB].map((team, index) => {
                    const isWinner = team != null && team.id === matchup.winnerTeam?.id;
                    return (
                      <div
                        key={`${matchup.bracketId}-${index}`}
                        className={`flex items-center justify-between rounded-lg px-3 py-2 text-sm ${
                          isWinner
                            ? "bg-[#3dff7a] font-black text-[#04210f]"
                            : "bg-white/[0.03] text-slate-200"
                        }`}
                      >
                        <span>{team?.name ?? TEAM_PLACEHOLDER}</span>
                        {isWinner && <span className="text-xs font-bold">Ganador</span>}
                      </div>
                    );
                  })}
                </div>
                <div className="mt-3 space-y-1 text-xs text-slate-400">
                  <p>
                    Ganador: <span className="font-semibold text-slate-200">{matchup.winnerTeam?.name ?? TEAM_PLACEHOLDER}</span>
                  </p>
                  {matchup.match ? (
                    <>
                      <p>Partido #{matchup.match.id} - {matchup.match.status}</p>
                      <p>
                        Resultado: {matchup.match.officialResult ? (RESULT_LABEL[matchup.match.officialResult] ?? matchup.match.officialResult) : "Pendiente"}
                      </p>
                    </>
                  ) : (
                    <p>Sin partido vinculado registrado.</p>
                  )}
                </div>
              </article>
            ))}
          </div>
        </Panel>
      ))}
    </div>
  );
}

export default function TorneoDesarrolloPage() {
  const params = useParams();
  const tournamentId = Number(params.id);
  const [data, setData] = useState<TournamentDevelopment | null>(null);
  const [loading, setLoading] = useState(true);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    if (!Number.isInteger(tournamentId) || tournamentId < 1) {
      setNotice({ tone: "error", title: "Torneo inválido", message: "El identificador del torneo no es válido." });
      setLoading(false);
      return;
    }
    document.title = "Desarrollo del Torneo - Sports System";
    setLoading(true);
    void (async () => {
      try {
        setData(await getTournamentDevelopment(tournamentId));
      } catch (error) {
        setNotice({ tone: "error", title: "No se pudo cargar el desarrollo", message: developmentError(error) });
      } finally {
        setLoading(false);
      }
    })();
  }, [tournamentId]);

  const phases = useMemo(() => data?.phases ?? [], [data]);

  return (
    <div>
      <PageHeader
        icon={<TrophyIcon />}
        title={data ? `Desarrollo: ${data.tournament.name}` : "Desarrollo del Torneo"}
        subtitle={
          data
            ? `${TOURNAMENT_STATUS_LABEL[data.tournament.status]} · ${formatDate(data.tournament.startDate)} - ${formatDate(data.tournament.endDate)}`
            : "Consulta tablas de posiciones y llaves del torneo"
        }
        actions={
          <Link
            to="/gestion/torneos"
            className="rounded-lg border border-[#245078] px-4 py-2.5 text-sm font-semibold text-slate-200 hover:bg-white/5"
          >
            Volver a torneos
          </Link>
        }
      />

      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      {loading ? (
        <EmptyNote>Cargando desarrollo del torneo…</EmptyNote>
      ) : !data ? (
        <EmptyNote>No fue posible mostrar el desarrollo del torneo.</EmptyNote>
      ) : phases.length === 0 ? (
        <EmptyNote>Este torneo no tiene fases configuradas.</EmptyNote>
      ) : (
        <div className="space-y-6">
          {phases.map((phase) => (
            <section key={phase.id} className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <h2 className="text-lg font-bold text-white">{phase.name}</h2>
                <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-bold text-sky-300">
                  {PHASE_TYPE_LABEL[phase.phaseType]}
                </span>
                <span className="rounded-full bg-white/10 px-2.5 py-1 text-xs font-semibold text-slate-300">
                  {PHASE_STATUS_LABEL[phase.status]}
                </span>
              </div>

              {phase.phaseType === "GROUPS" ? (
                (phase.groups?.length ?? 0) === 0 ? (
                  <EmptyNote>No hay grupos configurados en esta fase.</EmptyNote>
                ) : (
                  <div className="space-y-4">
                    {phase.groups!.map((group) => (
                      <GroupTable key={group.id} group={group} />
                    ))}
                  </div>
                )
              ) : (
                <KnockoutView rounds={phase.knockoutRounds ?? []} />
              )}
            </section>
          ))}
        </div>
      )}
    </div>
  );
}

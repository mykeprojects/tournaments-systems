import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RadarChart } from "../RadarChart";
import { useSportsCatalog } from "../SportsCatalogContext";
import { NameLookup } from "../NameLookup";
import { ChartIcon, SkillMark } from "../glyphs";
import { CATEGORY_TONE, FLAGS, RADAR_AXES } from "../options";
import { skillScore } from "../selectors";
import { Avatar, Crest, EmptyNote, PageHeader, Panel, StatusPill } from "../ui";

export default function PerfilDeportivoPage() {
  const catalog = useSportsCatalog();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);
  const [showHistory, setShowHistory] = useState(true);
  const player = catalog.players.find((item) => item.id === params.get("jugador")) ?? catalog.players[0] ?? null;

  useEffect(() => {
    document.title = "Perfil deportivo · Sports System+";
  }, []);

  const selectPlayer = (playerId: string) => {
    const next = new URLSearchParams(params);
    next.set("jugador", playerId);
    setParams(next);
    setQuery(null);
  };
  const skills = player
    ? catalog.playerSkills.flatMap((link) => {
        if (link.playerId !== player.id) {
          return [];
        }
        const skill = catalog.skills.find((item) => item.id === link.skillId);
        return skill ? [{ link, skill }] : [];
      })
    : [];
  const contracts = player
    ? catalog.contracts
        .filter((contract) => contract.playerId === player.id)
        .slice()
        .sort((left, right) => right.startDate.localeCompare(left.startDate))
    : [];
  const visibleContracts = showHistory ? contracts : contracts.filter((contract) => contract.status === "active");
  const media = skills.length
    ? Math.round(skills.reduce((total, item) => total + item.link.score, 0) / skills.length)
    : null;
  const axes = player
    ? RADAR_AXES.map((axis) => ({
        label: axis.label,
        value: skillScore(catalog.skills, catalog.playerSkills, player.id, axis.names) ?? 0,
        average: averageForPosition(catalog.players, catalog.skills, catalog.playerSkills, player.position, axis.names),
      }))
    : [];
  const preferred = catalog.sports.find((sport) => sport.id === player?.preferredSportId);

  return (
    <div>
      <PageHeader
        icon={<ChartIcon />}
        title="Perfil Deportivo del Jugador"
        subtitle="Consulta en un solo lugar los datos, equipos e habilidades del jugador."
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[160px_minmax(0,1fr)] md:items-center">
        <span className="text-sm font-semibold text-slate-300">Buscar jugador</span>
        <NameLookup
          ariaLabel="Buscar jugador"
          placeholder="Nombre del jugador"
          text={query ?? player?.fullName ?? ""}
          onTextChange={setQuery}
          options={catalog.players.map((item) => ({ id: item.id, label: item.fullName, hint: item.document }))}
          onPick={selectPlayer}
        />
      </div>
      {!player ? (
        <EmptyNote>No hay jugadores registrados.</EmptyNote>
      ) : (
        <>
          <div className="grid items-start gap-4 xl:grid-cols-[280px_minmax(0,1fr)_320px]">
            <Panel>
              <div className="p-4">
                <div className="flex items-end justify-between">
                  <p className="text-5xl font-black text-[#3dff7a]">{media ?? "—"}</p>
                  <Avatar name={player.fullName} />
                </div>
                <p className="mt-2 text-sm font-bold text-slate-300">{player.position}</p>
                <p className="text-sm text-slate-400">{FLAGS[player.nationality] ?? ""} {player.nationality}</p>
                <h2 className="mt-6 text-3xl font-black leading-none">{player.fullName}</h2>
                <dl className="mt-5 grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="rounded-xl border border-white/10 py-3"><dt className="text-slate-500">Edad</dt><dd className="mt-1 font-bold">{player.age}</dd></div>
                  <div className="rounded-xl border border-white/10 py-3"><dt className="text-slate-500">Altura</dt><dd className="mt-1 font-bold">{player.heightM.toFixed(2)} m</dd></div>
                  <div className="rounded-xl border border-white/10 py-3"><dt className="text-slate-500">Estado</dt><dd className="mt-1"><StatusPill status={player.status} /></dd></div>
                </dl>
              </div>
            </Panel>
            <Panel title="Atributos">
              {skills.length === 0 ? (
                <EmptyNote>Este jugador no tiene habilidades registradas.</EmptyNote>
              ) : (
                <div className="p-2">
                  <RadarChart axes={axes} />
                  <p className="pb-3 text-center text-[11px] text-slate-500">
                    <span className="text-sky-300">— Jugador</span>
                    <span className="ml-3">- - - Promedio posición ({player.position})</span>
                  </p>
                </div>
              )}
            </Panel>
            <div className="space-y-4">
              <Panel
                title="Equipos asociados"
                extra={
                  <button type="button" onClick={() => setShowHistory((current) => !current)} className="text-xs font-semibold text-sky-300">
                    {showHistory ? "Ver actuales" : "Ver historial"}
                  </button>
                }
              >
                {visibleContracts.length === 0 ? (
                  <EmptyNote>Este jugador no tiene equipos asociados.</EmptyNote>
                ) : (
                  <ul className="divide-y divide-white/5">
                    {visibleContracts.map((contract) => {
                      const team = catalog.teams.find((item) => item.id === contract.teamId);
                      return (
                        <li key={contract.id} className="flex items-center justify-between gap-3 px-4 py-3">
                          <span className="flex items-center gap-2">
                            {team && <Crest name={team.name} color={team.color} />}
                            <span>
                              <span className="block text-sm font-bold">{team?.name ?? "Equipo"}</span>
                              <span className="block text-xs text-slate-400">
                                {contract.startDate.slice(0, 4)} - {contract.status === "active" ? "actuales" : contract.endDate.slice(0, 4)}
                              </span>
                            </span>
                          </span>
                          {contract.status === "active" && <span className="text-xs font-bold text-[#3dff7a]">Actual</span>}
                        </li>
                      );
                    })}
                  </ul>
                )}
              </Panel>
              <Panel title="Habilidades">
                {skills.length === 0 ? (
                  <EmptyNote>Este jugador no tiene habilidades registradas.</EmptyNote>
                ) : (
                  <ul className="grid grid-cols-2 gap-2 p-4">
                    {skills.map(({ skill }) => (
                      <li key={skill.id} className="flex items-center gap-2 rounded-xl border border-[#1b3f63] px-3 py-2 text-sm">
                        <span className={CATEGORY_TONE[skill.category]}>
                          <SkillMark glyph={skill.glyph} className="h-4 w-4" />
                        </span>
                        {skill.name}
                      </li>
                    ))}
                  </ul>
                )}
              </Panel>
            </div>
          </div>
          <Panel title="Información básica" className="mt-4">
            <dl className="grid gap-4 p-4 text-sm sm:grid-cols-2 xl:grid-cols-5">
              <div><dt className="text-slate-500">Documento</dt><dd className="mt-1 font-semibold">{player.document}</dd></div>
              <div><dt className="text-slate-500">Email</dt><dd className="mt-1 font-semibold">{player.email || "Sin registrar"}</dd></div>
              <div><dt className="text-slate-500">Teléfono</dt><dd className="mt-1 font-semibold">{player.phone || "Sin registrar"}</dd></div>
              <div><dt className="text-slate-500">Pie dominante</dt><dd className="mt-1 font-semibold">{player.dominantFoot}</dd></div>
              <div><dt className="text-slate-500">Deporte preferido</dt><dd className="mt-1 font-semibold">{preferred?.name ?? "Sin registrar"}</dd></div>
            </dl>
          </Panel>
        </>
      )}
    </div>
  );
}

function averageForPosition(
  players: { id: string; position: string }[],
  skills: Parameters<typeof skillScore>[0],
  playerSkills: Parameters<typeof skillScore>[1],
  position: string,
  names: readonly string[]
): number {
  const scores = players
    .filter((item) => item.position === position)
    .map((item) => skillScore(skills, playerSkills, item.id, names))
    .filter((score): score is number => score !== null);
  if (scores.length === 0) {
    return 0;
  }
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

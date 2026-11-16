import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { RadarChart, ScoreBars } from "../RadarChart";
import { useSportsCatalog } from "../SportsCatalogContext";
import { NameLookup } from "../NameLookup";
import { SkillMark, StarIcon } from "../glyphs";
import { CATEGORY_TONE, POSITION_CLASS, RADAR_AXES } from "../options";
import { activeContract, skillScore } from "../selectors";
import { Avatar, Crest, EmptyNote, NoticeBanner, PageHeader, Panel, type Notice } from "../ui";

export default function AsignarHabilidadesPage() {
  const catalog = useSportsCatalog();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const player = catalog.players.find((item) => item.id === params.get("jugador")) ?? catalog.players[0] ?? null;

  useEffect(() => {
    document.title = "Asignar habilidades · Sports System+";
  }, []);

  const selectPlayer = (playerId: string) => {
    const next = new URLSearchParams(params);
    next.set("jugador", playerId);
    setParams(next);
    setQuery(null);
  };
  const assigned = player
    ? catalog.playerSkills.filter((link) => link.playerId === player.id)
    : [];
  const available = catalog.skills.filter((skill) => !assigned.some((link) => link.skillId === skill.id));
  const contract = player ? activeContract(catalog.contracts, player.id) : null;
  const team = catalog.teams.find((item) => item.id === contract?.teamId) ?? null;
  const axes = player
    ? RADAR_AXES.map((axis) => ({
        label: axis.label,
        value: skillScore(catalog.skills, catalog.playerSkills, player.id, axis.names) ?? 0,
        average: averageFor(catalog.players, catalog.skills, catalog.playerSkills, player.position, axis.names),
      }))
    : [];
  const bars = assigned
    .map((link) => {
      const skill = catalog.skills.find((item) => item.id === link.skillId);
      return skill ? { label: skill.name, value: link.score } : null;
    })
    .filter((item): item is { label: string; value: number } => Boolean(item));
  const media = bars.length
    ? Math.round(bars.reduce((total, item) => total + item.value, 0) / bars.length)
    : 0;

  const assign = async (skillId: string) => {
    if (!player) return;
    const result = await catalog.assignSkill(player.id, skillId);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  const remove = async (skillId: string) => {
    if (!player) return;
    const result = await catalog.removePlayerSkill(player.id, skillId);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<StarIcon />}
        title="Asignar habilidades a jugadores"
        subtitle="Selecciona y gestiona las habilidades que tendrá cada jugador."
      />
      {!player ? (
        <EmptyNote>Registra un jugador para asignar habilidades.</EmptyNote>
      ) : (
        <>
          <Panel className="mb-4">
            <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_auto] lg:items-center">
              <div>
                <NameLookup
                  ariaLabel="Buscar jugador"
                  placeholder="Buscar jugador"
                  text={query ?? player.fullName}
                  onTextChange={setQuery}
                  options={catalog.players.map((item) => ({ id: item.id, label: item.fullName, hint: item.position }))}
                  onPick={selectPlayer}
                />
              </div>
              <div className="flex items-center gap-3">
                <Avatar name={player.fullName} />
                <div>
                  <p className="font-bold">{player.fullName}</p>
                  <p className="text-xs text-slate-400">
                    <span className={`rounded px-1.5 py-0.5 font-bold ${POSITION_CLASS[player.position] ?? ""}`}>{player.position}</span>
                    <span className="ml-2">{player.age} años</span>
                  </p>
                </div>
                {team && (
                  <span className="flex items-center gap-2 text-sm text-slate-300">
                    <Crest name={team.name} color={team.color} />
                    {team.name}
                  </span>
                )}
              </div>
            </div>
          </Panel>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Panel title="Habilidades disponibles" extra={<span className="text-xs text-slate-400">{available.length} habilidades</span>}>
              <ul className="grid gap-3 p-4 sm:grid-cols-2">
                {available.map((skill) => (
                  <li key={skill.id} className="rounded-2xl border border-[#1b3f63] bg-[#06101c] p-4">
                    <span className={`flex h-10 w-10 items-center justify-center rounded-full ${CATEGORY_TONE[skill.category]}`}>
                      <SkillMark glyph={skill.glyph} />
                    </span>
                    <p className="mt-2 font-bold">{skill.name}</p>
                    <p className={`mt-1 w-fit rounded-full px-2 py-0.5 text-[11px] ${CATEGORY_TONE[skill.category]}`}>{skill.category}</p>
                    <p className="mt-2 text-xs leading-5 text-slate-400">{skill.description}</p>
                    <button type="button" onClick={() => assign(skill.id)} className="mt-3 w-full rounded-lg bg-[#3dff7a] px-3 py-2 text-sm font-extrabold text-[#04210f]">
                      + Asignar
                    </button>
                  </li>
                ))}
              </ul>
              {available.length === 0 && <EmptyNote>Este jugador ya tiene todas las habilidades del catálogo.</EmptyNote>}
              <p className="px-4 pb-4 text-xs text-slate-500">Selecciona una habilidad para asignarla al jugador.</p>
            </Panel>
            <div className="space-y-4">
              <Panel title="Habilidades del jugador" extra={<span className="text-xs text-[#3dff7a]">{assigned.length} asignadas</span>}>
                {assigned.length === 0 ? (
                  <EmptyNote>Este jugador no tiene habilidades registradas.</EmptyNote>
                ) : (
                  <ul className="grid gap-3 p-4 sm:grid-cols-2">
                    {assigned.map((link) => {
                      const skill = catalog.skills.find((item) => item.id === link.skillId);
                      if (!skill) return null;
                      return (
                        <li key={skill.id} className="rounded-2xl border border-[#1b3f63] bg-[#06101c] p-4">
                          <div className="flex items-start justify-between">
                            <span className={`flex h-10 w-10 items-center justify-center rounded-full ${CATEGORY_TONE[skill.category]}`}>
                              <SkillMark glyph={skill.glyph} />
                            </span>
                            <span className="text-lg font-black text-[#3dff7a]">{link.score}</span>
                          </div>
                          <p className="mt-2 font-bold">{skill.name}</p>
                          <p className="text-xs text-slate-400">{skill.description}</p>
                          <button type="button" onClick={() => remove(skill.id)} className="mt-3 text-sm font-semibold text-red-300">
                            Retirar
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                )}
                <p className="px-4 pb-4 text-xs text-slate-400">
                  Retirar una habilidad solo elimina la asociación del jugador con la habilidad. La habilidad seguirá disponible en el catálogo.
                </p>
              </Panel>
              <Panel title="Resumen de capacidades">
                {assigned.length === 0 ? (
                  <EmptyNote>Este jugador no tiene habilidades registradas.</EmptyNote>
                ) : (
                  <div className="grid gap-4 p-4 lg:grid-cols-[minmax(0,1fr)_180px]">
                    <div>
                      <RadarChart axes={axes} />
                      <ScoreBars items={bars} />
                    </div>
                    <div className="flex flex-col items-center justify-center rounded-2xl border border-white/10 p-4 text-center">
                      <p className="text-5xl font-black text-[#3dff7a]">{media}</p>
                      <p className="text-xs tracking-wide text-slate-400">MEDIA GENERAL</p>
                      <p className="mt-4 text-sm text-slate-300">{assigned.length} habilidades asignadas</p>
                      <p className="text-sm text-slate-300">{available.length} habilidades disponibles</p>
                      <p className="mt-2 text-sm font-bold text-[#3dff7a]">+{Math.max(0, media - 70)} impacto general</p>
                    </div>
                  </div>
                )}
              </Panel>
            </div>
          </div>
        </>
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

function averageFor(
  players: { id: string; position: string }[],
  skills: Parameters<typeof skillScore>[0],
  playerSkills: Parameters<typeof skillScore>[1],
  position: string,
  names: readonly string[]
): number {
  const scores = players
    .filter((player) => player.position === position)
    .map((player) => skillScore(skills, playerSkills, player.id, names))
    .filter((score): score is number => score !== null);
  if (scores.length === 0) {
    return 0;
  }
  return Math.round(scores.reduce((total, score) => total + score, 0) / scores.length);
}

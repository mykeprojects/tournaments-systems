import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "../format";
import { NameLookup } from "../NameLookup";
import { SportMark, TeamsIcon } from "../glyphs";
import { Crest, EmptyNote, NoticeBanner, PageHeader, Panel, type Notice } from "../ui";

export default function AsociarDeportesPage() {
  const catalog = useSportsCatalog();
  const [params, setParams] = useSearchParams();
  const [query, setQuery] = useState("");
  const [teamQuery, setTeamQuery] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);
  const requested = params.get("equipo");
  const team = catalog.teams.find((item) => item.id === requested) ?? catalog.teams[0] ?? null;

  useEffect(() => {
    document.title = "Asociar equipos con deportes · Sports System+";
  }, []);

  const selectTeam = (teamId: string) => {
    const next = new URLSearchParams(params);
    next.set("equipo", teamId);
    setParams(next);
  };

  const associated = team
    ? catalog.sports.filter((sport) =>
        catalog.teamSports.some((link) => link.teamId === team.id && link.sportId === sport.id)
      )
    : [];
  const available = catalog.sports.filter((sport) =>
    sport.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))
  );

  const associate = async (sportId: string) => {
    if (!team) {
      return;
    }
    const result = await catalog.associateSport(team.id, sportId);
    setNotice(
      result.ok
        ? { tone: "ok", message: result.message }
        : { tone: "error", message: result.message }
    );
  };

  const remove = async (sportId: string) => {
    if (!team) {
      return;
    }
    const result = await catalog.removeSportAssociation(team.id, sportId);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Asociar equipos con deportes"
        subtitle="Define las disciplinas deportivas en las que puede participar cada equipo."
      />
      {!team ? (
        <EmptyNote>Registra un equipo antes de asociar deportes.</EmptyNote>
      ) : (
        <>
          <Panel className="mb-4">
            <div className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center">
              <Crest name={team.name} color={team.color} />
              <div className="min-w-0 flex-1 text-sm font-semibold">
                Seleccionar equipo
                <NameLookup
                  ariaLabel="Buscar equipo"
                  placeholder="Buscar equipo"
                  text={teamQuery ?? team.name}
                  onTextChange={setTeamQuery}
                  options={catalog.teams.map((item) => ({ id: item.id, label: item.name, hint: item.city }))}
                  onPick={(id) => {
                    selectTeam(id);
                    setTeamQuery(null);
                  }}
                />
              </div>
            </div>
          </Panel>
          <div className="grid items-start gap-4 xl:grid-cols-2">
            <Panel title="Deportes disponibles">
              <div className="p-4">
                <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar deportes..." aria-label="Buscar deportes" className={fieldClass()} />
                <ul className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  {available.map((sport) => {
                    const linked = associated.some((item) => item.id === sport.id);
                    return (
                      <li key={sport.id} className="rounded-2xl border border-[#1b3f63] bg-[#06101c] p-4 text-center">
                        <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-[#3dff7a]/10 text-[#3dff7a]">
                          <SportMark name={sport.name} />
                        </span>
                        <p className="mt-2 text-sm font-bold">{sport.name}</p>
                        <button type="button" onClick={() => associate(sport.id)} className={`${primaryButtonClass} mt-3 w-full`}>
                          + Asociar
                        </button>
                        {linked && (
                          <p className="mt-2 text-[11px] text-amber-200">Este deporte ya se encuentra asociado al equipo.</p>
                        )}
                      </li>
                    );
                  })}
                </ul>
                <p className="mt-4 text-xs text-slate-500">Asocia los deportes relevantes para que tu equipo pueda participar en competencias.</p>
              </div>
            </Panel>
            <Panel title="Deportes asociados" extra={<span className="text-xs text-[#3dff7a]">{associated.length} deportes asociados</span>}>
              {associated.length === 0 ? (
                <EmptyNote>Este equipo no tiene deportes asociados.</EmptyNote>
              ) : (
                <ul className="divide-y divide-white/5">
                  {associated.map((sport) => (
                    <li key={sport.id} className="flex items-center justify-between gap-3 px-4 py-3">
                      <span className="flex items-center gap-2 text-sm font-semibold">
                        <SportMark name={sport.name} className="h-4 w-4 text-[#3dff7a]" />
                        {sport.name}
                      </span>
                      <button type="button" onClick={() => remove(sport.id)} className={ghostButtonClass}>
                        Retirar asociación
                      </button>
                    </li>
                  ))}
                </ul>
              )}
              <p className="px-4 py-3 text-xs text-slate-500">Retira una asociación para que el equipo deje de competir en esa disciplina. El equipo y el deporte no se eliminan.</p>
            </Panel>
          </div>
        </>
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { hasApplicationRole } from "../../domain/authorization/roleAccess";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";
import { NameLookup } from "../NameLookup";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, formatDate, ghostButtonClass, primaryButtonClass } from "../format";
import { SportMark, TeamsIcon } from "../glyphs";
import { CITIES } from "../options";
import { sportsOfTeam } from "../selectors";
import { fanTeamRequests, readSportError, type RemoteFollowedTeam } from "../sportApi";
import type { Status, Team } from "../types";
import {
  Crest,
  EmptyNote,
  Field,
  IconButton,
  Modal,
  NoticeBanner,
  PageHeader,
  Pager,
  Panel,
  StatusPill,
  usePaged,
  type Notice,
} from "../ui";

type TeamForm = {
  id?: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
};

const emptyForm = (): TeamForm => ({
  name: "",
  shortName: "",
  city: "",
  description: "",
  status: "active",
});

type FanTeam = {
  id: string;
  code: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
  createdAt: string;
  color: string;
  sports: { id: number; name: string; parentId: number | null }[];
};

type FanFollowed = FanTeam & { followedAt: string };

type TeamLike = {
  id?: number;
  teamId?: number;
  code: string;
  name: string;
  shortName: string;
  city: string;
  description: string;
  status: Status;
  createdAt: string;
  color: string;
  sports?: Array<{ id: number; name?: string; parentId?: number | null }>;
};

const toFanTeam = (team: TeamLike): FanTeam => ({
  id: String(team.id ?? team.teamId),
  code: team.code,
  name: team.name,
  shortName: team.shortName,
  city: team.city,
  description: team.description,
  status: team.status,
  createdAt: team.createdAt,
  color: team.color,
  sports: (team.sports ?? []).map((sport) => ({
    id: sport.id,
    name: sport.name ?? `Deporte #${sport.id}`,
    parentId: sport.parentId ?? null,
  })),
});

const toFollowed = (team: RemoteFollowedTeam): FanFollowed => ({
  ...toFanTeam(team),
  followedAt: team.followedAt,
});

function FanEquiposView() {
  const [teams, setTeams] = useState<FanTeam[]>([]);
  const [followed, setFollowed] = useState<FanFollowed[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyTeamId, setBusyTeamId] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [tab, setTab] = useState<"all" | "mine">("all");
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.title = "Equipos - Sports System";
  }, []);

  const refresh = useCallback(async () => {
    const teamsResponse = await fanTeamRequests.listTeams();
    const nextTeams = teamsResponse.data.map(toFanTeam);
    let nextFollowed: FanFollowed[] = [];
    try {
      const followedResponse = await fanTeamRequests.listFollowedTeams();
      nextFollowed = followedResponse.data.map(toFollowed);
    } catch (error) {
      setNotice((current) => current ?? { tone: "warn", message: readSportError(error) });
    }
    setTeams(nextTeams);
    setFollowed(nextFollowed);
    setSelectedId((current) => {
      if (current && nextTeams.some((team) => team.id === current)) return current;
      return nextTeams[0]?.id ?? null;
    });
  }, []);

  useEffect(() => {
    let active = true;
    setLoading(true);
    void refresh()
      .catch((error: unknown) => {
        if (!active) return;
        setNotice({ tone: "error", message: readSportError(error) });
      })
      .finally(() => {
        if (active) setLoading(false);
      });
    return () => {
      active = false;
    };
  }, [refresh]);

  const followedIds = useMemo(() => new Set(followed.map((team) => team.id)), [followed]);
  const source = tab === "mine" ? followed : teams;
  const filtered = source.filter((team) =>
    team.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es")),
  );
  const paging = usePaged(filtered, 6, `${tab}|${query}|${followed.length}|${teams.length}`);
  const selected =
    filtered.find((team) => team.id === selectedId) ??
    source.find((team) => team.id === selectedId) ??
    filtered[0] ??
    null;

  const toggleFollow = async (teamId: string) => {
    if (busyTeamId) return;
    setBusyTeamId(teamId);
    try {
      if (followedIds.has(teamId)) {
        const response = await fanTeamRequests.unfollowTeam(teamId);
        setNotice({ tone: "ok", message: response.data.message });
      } else {
        const response = await fanTeamRequests.followTeam(teamId);
        setNotice({ tone: "ok", message: response.data.message });
      }
      await refresh();
    } catch (error) {
      setNotice({ tone: "error", message: readSportError(error) });
    } finally {
      setBusyTeamId(null);
    }
  };

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Equipos"
        subtitle="Consulta los equipos registrados y sigue a tus favoritos"
      />
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <div className="inline-flex rounded-xl border border-[#245078] bg-[#071321] p-1">
          <button
            type="button"
            onClick={() => setTab("all")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "all" ? "bg-[#3dff7a] text-[#04210f]" : "text-slate-300"}`}
          >
            Todos los equipos
          </button>
          <button
            type="button"
            onClick={() => setTab("mine")}
            className={`rounded-lg px-3 py-2 text-sm font-semibold ${tab === "mine" ? "bg-[#3dff7a] text-[#04210f]" : "text-slate-300"}`}
          >
            Mis equipos ({followed.length})
          </button>
        </div>
        <div className="min-w-[240px] flex-1">
          <input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Buscar equipo"
            placeholder="Buscar equipo..."
            className={fieldClass()}
          />
        </div>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel
          title={tab === "mine" ? "Mis equipos seguidos" : "Lista de equipos"}
          extra={<span className="text-xs text-slate-400">{filtered.length} equipos</span>}
        >
          {loading ? (
            <div className="px-4 py-8 text-center text-sm text-slate-300">Cargando equipos...</div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full min-w-[720px] text-left">
                  <thead>
                    <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                      <th className="px-4 py-3 font-semibold">Equipo</th>
                      <th className="px-3 py-3 font-semibold">Ciudad</th>
                      <th className="px-3 py-3 font-semibold">Deportes</th>
                      <th className="px-3 py-3 font-semibold">Estado</th>
                      <th className="px-3 py-3 font-semibold">Seguimiento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {paging.current.map((team) => {
                      const isFollowed = followedIds.has(team.id);
                      const busy = busyTeamId === team.id;
                      return (
                        <tr
                          key={`${tab}-${team.id}`}
                          onClick={() => setSelectedId(team.id)}
                          className={`cursor-pointer border-t border-white/5 ${selected?.id === team.id ? "bg-white/5" : "hover:bg-white/[0.03]"}`}
                        >
                          <td className="px-4 py-3">
                            <span className="flex items-center gap-2">
                              <Crest name={team.name} color={team.color} />
                              <span>
                                <span className="block font-semibold">{team.name}</span>
                                <span className="block text-xs text-slate-500">{team.shortName}</span>
                              </span>
                            </span>
                          </td>
                          <td className="px-3 py-3 text-slate-300">{team.city}</td>
                          <td className="px-3 py-3">
                            <span className="flex flex-wrap gap-1 text-[#3dff7a]">
                              {team.sports.slice(0, 3).map((sport) => (
                                <span key={`${team.id}-${sport.id}`} className="inline-flex items-center gap-1 rounded-full border border-[#245078] px-2 py-0.5 text-[11px] text-slate-200">
                                  <SportMark name={sport.name} className="h-3.5 w-3.5 text-[#3dff7a]" />
                                  {sport.name}
                                </span>
                              ))}
                              {team.sports.length === 0 && <span className="text-xs text-slate-500">Sin deportes</span>}
                            </span>
                          </td>
                          <td className="px-3 py-3"><StatusPill status={team.status} /></td>
                          <td className="px-3 py-3">
                            <button
                              type="button"
                              disabled={busy}
                              onClick={(event) => {
                                event.stopPropagation();
                                void toggleFollow(team.id);
                              }}
                              className={isFollowed ? ghostButtonClass : primaryButtonClass}
                            >
                              {busy ? "Guardando..." : isFollowed ? "Dejar de seguir" : "Seguir equipo"}
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
                {paging.total === 0 && (
                  <EmptyNote>
                    {tab === "mine"
                      ? "Aún no sigues equipos. Desde \"Todos los equipos\" puedes hacerte aficionado."
                      : "No hay equipos para esta búsqueda."}
                  </EmptyNote>
                )}
              </div>
              <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
            </>
          )}
        </Panel>
        <Panel title="Detalle del equipo">
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <Crest name={selected.name} color={selected.color} large />
                <div>
                  <h3 className="text-xl font-black">{selected.name}</h3>
                  <div className="mt-1 flex flex-wrap items-center gap-2">
                    <StatusPill status={selected.status} />
                    {followedIds.has(selected.id) && (
                      <span className="inline-flex items-center rounded-full bg-emerald-400/15 px-2.5 py-1 text-xs font-bold text-emerald-300">
                        Siguiendo
                      </span>
                    )}
                  </div>
                </div>
              </div>
              <dl className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Ciudad</dt><dd>{selected.city}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Fecha de creación</dt><dd>{formatDate(selected.createdAt)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Nombre corto</dt><dd>{selected.shortName}</dd></div>
              </dl>
              <div>
                <button
                  type="button"
                  disabled={busyTeamId === selected.id}
                  onClick={() => void toggleFollow(selected.id)}
                  className={followedIds.has(selected.id) ? ghostButtonClass : primaryButtonClass}
                >
                  {busyTeamId === selected.id
                    ? "Guardando..."
                    : followedIds.has(selected.id)
                      ? "Dejar de seguir"
                      : "Seguir equipo"}
                </button>
              </div>
              <div>
                <p className="text-sm font-bold">Descripción</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{selected.description || "Sin descripción"}</p>
              </div>
              <div>
                <p className="text-sm font-bold">Deportes</p>
                {selected.sports.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">Este equipo no tiene deportes asociados.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {selected.sports.map((sport) => (
                      <li key={`${selected.id}-${sport.id}`} className="inline-flex items-center gap-1 rounded-full border border-[#245078] px-3 py-1 text-xs">
                        <SportMark name={sport.name} className="h-3.5 w-3.5 text-[#3dff7a]" />
                        {sport.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <EmptyNote>{loading ? "Cargando..." : tab === "mine" ? "Selecciona un equipo seguido." : "Selecciona un equipo."}</EmptyNote>
          )}
        </Panel>
      </div>
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

export default function EquiposPage() {
  const { roles } = useAuth();
  const roleNames = roles.map((role) => role.name);
  const isFan = hasApplicationRole(roleNames, "fan")
    && !hasApplicationRole(roleNames, "sportsAdmin");

  if (isFan) {
    return <FanEquiposView />;
  }

  return <AdminEquiposView />;
}

function AdminEquiposView() {
  const catalog = useSportsCatalog();
  const [params] = useSearchParams();
  const [query, setQuery] = useState("");
  const [sportId, setSportId] = useState("todos");
  const [status, setStatus] = useState<"todos" | Status>("todos");
  const [selectedId, setSelectedId] = useState(params.get("equipo") ?? "atletico");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TeamForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.title = "Gestión de Equipos - Sports System";
  }, []);

  const parents = catalog.sports.filter((sport) => sport.parentId === null);
  const filtered = catalog.teams.filter((team) => {
    const matchesQuery = team.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
    const matchesStatus = status === "todos" || team.status === status;
    const matchesSport =
      sportId === "todos" ||
      catalog.teamSports.some((link) => {
        if (link.teamId !== team.id) {
          return false;
        }
        const sport = catalog.sports.find((item) => item.id === link.sportId);
        return sport?.id === sportId || sport?.parentId === sportId;
      });
    return matchesQuery && matchesStatus && matchesSport;
  });
  const paging = usePaged(filtered, 5, `${query}|${sportId}|${status}`);

  const selected = catalog.teams.find((team) => team.id === selectedId) ?? filtered[0] ?? null;
  const selectedSports = selected ? sportsOfTeam(catalog.teamSports, catalog.sports, selected.id) : [];
  const playerCount = selected
    ? catalog.contracts.filter((contract) => contract.teamId === selected.id && contract.status === "active").length
    : 0;

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (team: Team) => {
    setSelectedId(team.id);
    setForm({
      id: team.id,
      name: team.name,
      shortName: team.shortName,
      city: team.city,
      description: team.description,
      status: team.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Este campo es obligatorio.";
    if (!form.shortName.trim()) nextErrors.shortName = "Este campo es obligatorio.";
    if (!form.city) nextErrors.city = "Este campo es obligatorio.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const result = await catalog.saveTeam(form);
    if (!result.ok) {
      setErrors({ name: result.message });
      return;
    }
    if (result.id) setSelectedId(result.id);
    setNotice({ tone: "ok", message: result.message });
    setModalOpen(false);
  };

  const handleDelete = async (team: Team) => {
    if (catalog.contracts.some((contract) => contract.teamId === team.id)) {
      setNotice({
        tone: "error",
        title: "No se puede eliminar el equipo",
        message: "No se puede eliminar el equipo porque tiene jugadores o competencias asociadas.",
      });
      return;
    }
    if (catalog.teamSports.some((link) => link.teamId === team.id)) {
      setNotice({
        tone: "error",
        title: "No se puede eliminar el equipo",
        message: "No se puede eliminar el equipo porque tiene deportes asociados. Retira las asociaciones primero.",
      });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar "${team.name}"?`)) {
      return;
    }
    const result = await catalog.deleteTeam(team.id);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<TeamsIcon />}
        title="Gestión de Equipos"
        subtitle="Administra los equipos registrados en la plataforma"
        actions={
          <>
            {selected && (
              <Link to={`${routePaths.sportsTeamSports}?equipo=${selected.id}`} className={ghostButtonClass}>
                Asociar deportes
              </Link>
            )}
            {selected && (
              <Link to={`${routePaths.sportsRoster}?equipo=${selected.id}`} className={ghostButtonClass}>
                Plantilla
              </Link>
            )}
            <button type="button" onClick={openCreate} className={primaryButtonClass}>+ Nuevo equipo</button>
          </>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_180px]">
        <NameLookup
          ariaLabel="Buscar equipo"
          placeholder="Buscar equipo..."
          text={query}
          onTextChange={setQuery}
          options={catalog.teams.map((team) => ({ id: team.id, label: team.name, hint: team.city }))}
          onPick={(id) => {
            const team = catalog.teams.find((item) => item.id === id);
            if (!team) {
              return;
            }
            setQuery(team.name);
            setSelectedId(team.id);
          }}
        />
        <select value={sportId} onChange={(event) => setSportId(event.target.value)} aria-label="Filtrar por deporte" className={fieldClass()}>
          <option value="todos">Todos los deportes</option>
          {parents.map((sport) => (
            <option key={sport.id} value={sport.id}>{sport.name}</option>
          ))}
        </select>
        <select value={status} onChange={(event) => setStatus(event.target.value as "todos" | Status)} aria-label="Filtrar por estado" className={fieldClass()}>
          <option value="todos">Todos los estados</option>
          <option value="active">Activo</option>
          <option value="inactive">Inactivo</option>
        </select>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel title="Lista de equipos" extra={<span className="text-xs text-slate-400">{filtered.length} equipos</span>}>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Equipo</th>
                  <th className="px-3 py-3 font-semibold">Ciudad</th>
                  <th className="px-3 py-3 font-semibold">Deportes</th>
                  <th className="px-3 py-3 font-semibold">Jugadores</th>
                  <th className="px-3 py-3 font-semibold">Estado</th>
                  <th className="px-3 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paging.current.map((team) => {
                  const sports = sportsOfTeam(catalog.teamSports, catalog.sports, team.id);
                  const players = catalog.contracts.filter((contract) => contract.teamId === team.id && contract.status === "active").length;
                  return (
                    <tr key={team.id} onClick={() => setSelectedId(team.id)} className={`cursor-pointer border-t border-white/5 ${selected?.id === team.id ? "bg-white/5" : "hover:bg-white/[0.03]"}`}>
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2">
                          <Crest name={team.name} color={team.color} />
                          <span>
                            <span className="block font-semibold">{team.name}</span>
                            <span className="block text-xs text-slate-500">{team.shortName}</span>
                          </span>
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{team.city}</td>
                      <td className="px-3 py-3">
                        <span className="flex gap-1 text-[#3dff7a]">
                          {sports.slice(0, 3).map((sport) => (
                            <SportMark key={sport.id} name={sport.name} className="h-4 w-4" />
                          ))}
                        </span>
                      </td>
                      <td className="px-3 py-3">{players}</td>
                      <td className="px-3 py-3"><StatusPill status={team.status} /></td>
                      <td className="px-3 py-3">
                        <span className="flex gap-2">
                          <IconButton label={`Ver ${team.name}`} tone="view" onClick={() => setSelectedId(team.id)} />
                          <IconButton label={`Editar ${team.name}`} tone="edit" onClick={() => openEdit(team)} />
                          <IconButton label={`Eliminar ${team.name}`} tone="delete" onClick={() => handleDelete(team)} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {paging.total === 0 && <EmptyNote>No hay equipos para esta búsqueda.</EmptyNote>}
          </div>
          <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
        </Panel>
        <Panel title="Detalle del equipo">
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <Crest name={selected.name} color={selected.color} large />
                <div>
                  <h3 className="text-xl font-black">{selected.name}</h3>
                  <StatusPill status={selected.status} />
                </div>
              </div>
              <dl className="space-y-2 text-sm text-slate-300">
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Ciudad</dt><dd>{selected.city}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Fecha de creación</dt><dd>{formatDate(selected.createdAt)}</dd></div>
                <div className="flex justify-between gap-3"><dt className="text-slate-500">Nombre corto</dt><dd>{selected.shortName}</dd></div>
              </dl>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div className="rounded-xl border border-white/10 px-2 py-3">
                  <p className="text-xl font-black text-sky-300">{selectedSports.length}</p>
                  <p className="text-[11px] text-slate-400">Deportes asociados</p>
                </div>
                <div className="rounded-xl border border-white/10 px-2 py-3">
                  <p className="text-xl font-black text-sky-300">{playerCount}</p>
                  <p className="text-[11px] text-slate-400">Jugadores registrados</p>
                </div>
                <div className="rounded-xl border border-white/10 px-2 py-3">
                  <p className="text-xl font-black text-sky-300">0</p>
                  <p className="text-[11px] text-slate-400">Competencias activas</p>
                </div>
              </div>
              <div>
                <p className="text-sm font-bold">Descripción</p>
                <p className="mt-1 text-sm leading-6 text-slate-300">{selected.description || "Sin descripción"}</p>
              </div>
              <div>
                <p className="text-sm font-bold">Deportes asociados</p>
                {selectedSports.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">Este equipo no tiene deportes asociados.</p>
                ) : (
                  <ul className="mt-2 flex flex-wrap gap-2">
                    {selectedSports.map((sport) => (
                      <li key={sport.id} className="inline-flex items-center gap-1 rounded-full border border-[#245078] px-3 py-1 text-xs">
                        <SportMark name={sport.name} className="h-3.5 w-3.5 text-[#3dff7a]" />
                        {sport.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </div>
          ) : (
            <EmptyNote>Selecciona o registra un equipo.</EmptyNote>
          )}
        </Panel>
      </div>
      {modalOpen && (
        <Modal title="Registrar / Editar equipo" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 sm:grid-cols-2">
            <Field label="Nombre del equipo" required error={errors.name}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} />
            </Field>
            <Field label="Nombre corto" required error={errors.shortName}>
              <input value={form.shortName} onChange={(event) => setForm({ ...form, shortName: event.target.value })} className={fieldClass(Boolean(errors.shortName))} />
            </Field>
            <Field label="Ciudad" required error={errors.city}>
              <select value={form.city} onChange={(event) => setForm({ ...form, city: event.target.value })} className={fieldClass(Boolean(errors.city))}>
                <option value="">Selecciona una ciudad</option>
                {CITIES.map((city) => (
                  <option key={city} value={city}>{city}</option>
                ))}
              </select>
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })} className={fieldClass()}>
                <option value="active">Activo</option>
                <option value="inactive">Inactivo</option>
              </select>
            </Field>
            <div className="sm:col-span-2">
              <Field label="Descripción">
                <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClass()} rows={3} />
              </Field>
            </div>
            <div className="flex justify-end gap-3 sm:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className={ghostButtonClass}>Cancelar</button>
              <button type="submit" className={primaryButtonClass}>Guardar</button>
            </div>
          </form>
        </Modal>
      )}
      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />
    </div>
  );
}

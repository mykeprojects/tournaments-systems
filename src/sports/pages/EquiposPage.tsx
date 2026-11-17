import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { routePaths } from "../../routes/routePaths";
import { NameLookup } from "../NameLookup";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, formatDate, ghostButtonClass, primaryButtonClass } from "../format";
import { SportMark, TeamsIcon } from "../glyphs";
import { CITIES } from "../options";
import { sportsOfTeam } from "../selectors";
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

export default function EquiposPage() {
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
    document.title = "Gestión de Equipos · Sports System+";
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

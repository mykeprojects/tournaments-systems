import { useEffect, useMemo, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, formatDate, primaryButtonClass } from "../format";
import { TrophyIcon } from "../glyphs";
import {
  deleteTournament,
  listTournaments,
  saveTournament,
  TOURNAMENT_STATUS_LABEL,
  tournamentError,
  type Tournament,
  type TournamentInput,
  type TournamentStatus,
} from "../tournamentApi";
import {
  EmptyNote,
  Field,
  IconButton,
  Modal,
  NoticeBanner,
  PageHeader,
  Pager,
  Panel,
  usePaged,
  type Notice,
} from "../ui";

const STATUSES: TournamentStatus[] = [
  "DRAFT",
  "REGISTRATION_OPEN",
  "IN_PROGRESS",
  "FINISHED",
  "CANCELLED",
];

const emptyForm = (): TournamentInput => ({
  name: "",
  description: "",
  sportId: 0,
  location: "",
  startDate: "",
  endDate: "",
  status: "DRAFT",
});

export default function TorneosPage() {
  const { roleName } = useAuth();
  const isFan = (roleName ?? "").trim().toUpperCase() === "AFICIONADO";
  const catalog = useSportsCatalog();
  const [items, setItems] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | TournamentStatus>("todos");
  const [sportId, setSportId] = useState("todos");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<TournamentInput>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  const reload = async () => {
    setLoading(true);
    try {
      setItems(await listTournaments());
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudieron cargar los torneos", message: tournamentError(error) });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = `${isFan ? "Torneos" : "Gestión de Torneos"} - Sports System`;
    void reload();
  }, []);

  const sports = catalog.sports.filter((sport) => sport.parentId === null);

  const filtered = useMemo(() => items.filter((item) => {
    const matchesQuery = item.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"))
      || (item.location ?? "").toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
    const matchesStatus = status === "todos" || item.status === status;
    const matchesSport = sportId === "todos" || item.sportId === Number(sportId);
    return matchesQuery && matchesStatus && matchesSport;
  }), [items, query, status, sportId]);

  const paging = usePaged(filtered, 8, `${query}|${status}|${sportId}`);

  const openCreate = () => {
    if (isFan) return;
    setForm({ ...emptyForm(), sportId: sports[0] ? Number(sports[0].id) : 0 });
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (item: Tournament) => {
    if (isFan) return;
    setForm({
      id: item.id,
      name: item.name,
      description: item.description,
      sportId: item.sportId,
      location: item.location ?? "",
      startDate: item.startDate,
      endDate: item.endDate,
      status: item.status,
    });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isFan) return;
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Este campo es obligatorio.";
    if (!form.sportId) nextErrors.sportId = "Selecciona un deporte.";
    if (!form.startDate) nextErrors.startDate = "Selecciona la fecha de inicio.";
    if (!form.endDate) nextErrors.endDate = "Selecciona la fecha de finalización.";
    if (form.startDate && form.endDate && form.endDate < form.startDate) {
      nextErrors.endDate = "La fecha final debe ser posterior a la inicial.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length) return;

    try {
      const result = await saveTournament(form);
      setNotice({ tone: "ok", message: result.message });
      setModalOpen(false);
      await reload();
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo guardar", message: tournamentError(error) });
    }
  };

  const handleDelete = async (item: Tournament) => {
    if (isFan) return;
    if (item.status === "IN_PROGRESS") {
      setNotice({ tone: "error", title: "No se puede eliminar", message: "Un torneo en progreso no puede eliminarse." });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar "${item.name}"?`)) return;
    try {
      const result = await deleteTournament(item.id);
      setNotice({ tone: "ok", message: result.message });
      await reload();
    } catch (error) {
      setNotice({ tone: "error", title: "No se pudo eliminar", message: tournamentError(error) });
    }
  };

  const sportName = (sportId: number) =>
    sports.find((sport) => Number(sport.id) === sportId)?.name ?? `Deporte #${sportId}`;

  return (
    <div>
      <PageHeader
        icon={<TrophyIcon />}
        title={isFan ? "Torneos" : "Gestión de Torneos"}
        subtitle={isFan ? "Consulta los torneos registrados en la plataforma" : "Administra torneos, fechas y deporte asociado"}
        actions={
          isFan ? undefined : (
            <button type="button" onClick={openCreate} className={primaryButtonClass}>
              + Nuevo torneo
            </button>
          )
        }
      />

      <NoticeBanner notice={notice} onClose={() => setNotice(null)} />

      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_200px_200px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar torneo"
          aria-label="Buscar torneo"
          className={fieldClass()}
        />
        <select value={sportId} onChange={(event) => setSportId(event.target.value)} className={fieldClass()} aria-label="Filtrar por deporte">
          <option value="todos">Todos los deportes</option>
          {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
        </select>
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "todos" | TournamentStatus)}
          className={fieldClass()}
          aria-label="Filtrar por estado"
        >
          <option value="todos">Todos los estados</option>
          {STATUSES.map((value) => <option key={value} value={value}>{TOURNAMENT_STATUS_LABEL[value]}</option>)}
        </select>
      </div>

      <Panel>
        {loading ? (
          <EmptyNote>Cargando torneos…</EmptyNote>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left">
                <thead>
                  <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                    <th className="px-4 py-3 font-semibold">Torneo</th>
                    <th className="px-3 py-3 font-semibold">Deporte</th>
                    <th className="px-3 py-3 font-semibold">Fechas</th>
                    <th className="px-3 py-3 font-semibold">Sede</th>
                    <th className="px-3 py-3 font-semibold">Estado</th>
                    <th className="px-3 py-3 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {paging.current.map((item) => (
                    <tr key={item.id} className="border-t border-white/5 hover:bg-white/[0.03]">
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <span className="flex h-9 w-9 items-center justify-center rounded-lg bg-[#3dff7a]/10 text-[#3dff7a]"><TrophyIcon /></span>
                          {item.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{sportName(item.sportId)}</td>
                      <td className="px-3 py-3 text-slate-300">{formatDate(item.startDate)} - {formatDate(item.endDate)}</td>
                      <td className="px-3 py-3 text-slate-300">{item.location || "Sin sede"}</td>
                      <td className="px-3 py-3">
                        <span className="rounded-full bg-sky-400/15 px-2.5 py-1 text-xs font-bold text-sky-300">
                          {TOURNAMENT_STATUS_LABEL[item.status]}
                        </span>
                      </td>
                      <td className="px-3 py-3">
                        <span className="flex flex-wrap items-center gap-2">
                          <Link
                            to={`/gestion/torneos/${item.id}/desarrollo`}
                            className="inline-flex items-center rounded-lg border border-[#245078] px-3 py-1.5 text-xs font-semibold text-slate-200 hover:bg-white/5"
                          >
                            Ver desarrollo
                          </Link>
                          {!isFan && (
                            <>
                              <IconButton label={`Editar ${item.name}`} tone="edit" onClick={() => openEdit(item)} />
                              <IconButton label={`Eliminar ${item.name}`} tone="delete" onClick={() => void handleDelete(item)} />
                            </>
                          )}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {paging.total === 0 && <EmptyNote>No hay torneos registrados.</EmptyNote>}
            </div>
            <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
          </>
        )}
      </Panel>

      {modalOpen && !isFan && (
        <Modal title={form.id ? "Editar torneo" : "Nuevo torneo"} onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="grid gap-4 md:grid-cols-2">
            <Field label="Nombre" required error={errors.name}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} />
            </Field>
            <Field label="Deporte" required error={errors.sportId}>
              <select value={form.sportId || ""} onChange={(event) => setForm({ ...form, sportId: Number(event.target.value) })} className={fieldClass(Boolean(errors.sportId))}>
                <option value="">Seleccionar</option>
                {sports.map((sport) => <option key={sport.id} value={sport.id}>{sport.name}</option>)}
              </select>
            </Field>
            <Field label="Fecha de inicio" required error={errors.startDate}>
              <input type="date" value={form.startDate} onChange={(event) => setForm({ ...form, startDate: event.target.value })} className={fieldClass(Boolean(errors.startDate))} />
            </Field>
            <Field label="Fecha de finalización" required error={errors.endDate}>
              <input type="date" value={form.endDate} onChange={(event) => setForm({ ...form, endDate: event.target.value })} className={fieldClass(Boolean(errors.endDate))} />
            </Field>
            <Field label="Sede">
              <input value={form.location} onChange={(event) => setForm({ ...form, location: event.target.value })} className={fieldClass()} />
            </Field>
            <Field label="Estado">
              <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as TournamentStatus })} className={fieldClass()}>
                {STATUSES.map((value) => <option key={value} value={value}>{TOURNAMENT_STATUS_LABEL[value]}</option>)}
              </select>
            </Field>
            <Field label="Descripción" error={undefined}>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} rows={3} className={fieldClass()} />
            </Field>
            <div className="flex items-end justify-end gap-3 md:col-span-2">
              <button type="button" onClick={() => setModalOpen(false)} className="rounded-lg border border-white/10 px-4 py-2.5 text-sm font-semibold text-slate-300">Cancelar</button>
              <button type="submit" className={primaryButtonClass}>{form.id ? "Guardar cambios" : "Crear torneo"}</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

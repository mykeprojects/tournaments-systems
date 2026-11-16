import { useEffect, useMemo, useState, type FormEvent } from "react";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, formatDate, ghostButtonClass, primaryButtonClass } from "../format";
import { BallIcon, SportMark } from "../glyphs";
import { SPORT_CATEGORIES } from "../options";
import { familyIds, parentSports, subdeportesOf } from "../selectors";
import type { Sport, Status } from "../types";
import {
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

type SportForm = {
  id?: string;
  name: string;
  category: string;
  description: string;
  status: Status;
  subdeportes: string[];
};

const emptyForm = (): SportForm => ({
  name: "",
  category: "",
  description: "",
  status: "activo",
  subdeportes: [],
});

export default function DeportesPage() {
  const catalog = useSportsCatalog();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<"todos" | Status>("todos");
  const [selectedId, setSelectedId] = useState("futbol");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SportForm>(emptyForm);
  const [draftSub, setDraftSub] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.title = "Gestión de Deportes · Sports System+";
  }, []);

  const parents = useMemo(() => parentSports(catalog.sports), [catalog.sports]);
  const filtered = parents.filter((sport) => {
    const matchesQuery = sport.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
    return matchesQuery && (status === "todos" || sport.status === status);
  });
  const paging = usePaged(filtered, 5, `${query}|${status}`);

  const selected = parents.find((sport) => sport.id === selectedId) ?? filtered[0] ?? null;
  const subs = selected ? subdeportesOf(catalog.sports, selected.id) : [];
  const teamCount = selected
    ? new Set(
        catalog.teamSports
          .filter((link) => familyIds(catalog.sports, selected.id).includes(link.sportId))
          .map((link) => link.teamId)
      ).size
    : 0;

  const openCreate = () => {
    setForm(emptyForm());
    setDraftSub("");
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (sport: Sport) => {
    setSelectedId(sport.id);
    setForm({
      id: sport.id,
      name: sport.name,
      category: sport.category,
      description: sport.description,
      status: sport.status,
      subdeportes: subdeportesOf(catalog.sports, sport.id).map((item) => item.name),
    });
    setDraftSub("");
    setErrors({});
    setModalOpen(true);
  };

  const addSub = () => {
    const name = draftSub.trim().replace(/\s+/g, " ");
    if (!name) {
      return;
    }
    if (form.subdeportes.some((item) => item.toLocaleLowerCase("es") === name.toLocaleLowerCase("es"))) {
      setErrors((current) => ({ ...current, sub: "Ese subdeporte ya está en la lista." }));
      return;
    }
    setForm((current) => ({ ...current, subdeportes: [...current.subdeportes, name] }));
    setDraftSub("");
    setErrors((current) => ({ ...current, sub: "" }));
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) {
      nextErrors.name = "Este campo es obligatorio.";
    }
    if (!form.category) {
      nextErrors.category = "Este campo es obligatorio.";
    }
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) {
      return;
    }
    const result = await catalog.saveSport(form);
    if (!result.ok) {
      setErrors({ name: result.message });
      return;
    }
    if (result.id) {
      setSelectedId(result.id);
    }
    setNotice({ tone: "ok", message: result.message });
    setModalOpen(false);
  };

  const handleDelete = async (sport: Sport) => {
    const used = catalog.teamSports.some((link) =>
      familyIds(catalog.sports, sport.id).includes(link.sportId)
    );
    if (used) {
      setNotice({
        tone: "error",
        title: "No se puede eliminar",
        message: `No se puede eliminar "${sport.name}" porque tiene equipos asociados.`,
      });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar "${sport.name}"?`)) {
      return;
    }
    const result = await catalog.deleteSport(sport.id);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<BallIcon />}
        title="Gestión de Deportes"
        subtitle="Administra disciplinas y subdeportes registrados en la plataforma"
        actions={
          <button type="button" onClick={openCreate} className={primaryButtonClass}>
            + Nuevo deporte
          </button>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_180px]">
        <input
          value={query}
          onChange={(event) => setQuery(event.target.value)}
          placeholder="Buscar deporte"
          aria-label="Buscar deporte"
          className={fieldClass()}
        />
        <select
          value={status}
          onChange={(event) => setStatus(event.target.value as "todos" | Status)}
          aria-label="Filtrar por estado"
          className={fieldClass()}
        >
          <option value="todos">Estado</option>
          <option value="activo">Activo</option>
          <option value="inactivo">Inactivo</option>
        </select>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_340px]">
        <Panel>
          <div className="overflow-x-auto">
            <table className="w-full min-w-[640px] text-left">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                  <th className="px-4 py-3 font-semibold">Deporte</th>
                  <th className="px-3 py-3 font-semibold">Categoría</th>
                  <th className="px-3 py-3 font-semibold">Subdeportes</th>
                  <th className="px-3 py-3 font-semibold">Estado</th>
                  <th className="px-3 py-3 font-semibold">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {paging.current.map((sport) => {
                  const count = subdeportesOf(catalog.sports, sport.id).length;
                  return (
                    <tr
                      key={sport.id}
                      onClick={() => setSelectedId(sport.id)}
                      className={`cursor-pointer border-t border-white/5 ${selected?.id === sport.id ? "bg-white/5" : "hover:bg-white/[0.03]"}`}
                    >
                      <td className="px-4 py-3">
                        <span className="flex items-center gap-2 font-semibold">
                          <SportMark name={sport.name} className="h-4 w-4 text-[#3dff7a]" />
                          {sport.name}
                        </span>
                      </td>
                      <td className="px-3 py-3 text-slate-300">{sport.category}</td>
                      <td className="px-3 py-3 text-slate-300">{count} {count === 1 ? "subdeporte" : "subdeportes"}</td>
                      <td className="px-3 py-3"><StatusPill status={sport.status} /></td>
                      <td className="px-3 py-3">
                        <span className="flex gap-2">
                          <IconButton label={`Ver ${sport.name}`} tone="view" onClick={() => setSelectedId(sport.id)} />
                          <IconButton label={`Editar ${sport.name}`} tone="edit" onClick={() => openEdit(sport)} />
                          <IconButton label={`Eliminar ${sport.name}`} tone="delete" onClick={() => handleDelete(sport)} />
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {paging.total === 0 && <EmptyNote>No hay deportes para esta búsqueda.</EmptyNote>}
          </div>
          <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
        </Panel>
        <Panel title="Detalle del deporte" extra={selected ? <span className="text-xs text-slate-500">{selected.code}</span> : null}>
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-4">
                <span className="flex h-24 w-24 items-center justify-center rounded-2xl border border-[#3dff7a]/40 bg-[#07111d] text-[#3dff7a]">
                  <SportMark name={selected.name} className="h-12 w-12" />
                </span>
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="text-xl font-black">{selected.name}</h3>
                    <StatusPill status={selected.status} />
                  </div>
                  <p className="mt-2 text-xs text-slate-500">Creado el {formatDate(selected.createdAt)}</p>
                </div>
              </div>
              <dl className="grid grid-cols-[110px_minmax(0,1fr)] gap-y-2 text-sm">
                <dt className="text-slate-500">Nombre</dt>
                <dd>{selected.name}</dd>
                <dt className="text-slate-500">Categoría</dt>
                <dd>{selected.category}</dd>
                <dt className="text-slate-500">Descripción</dt>
                <dd className="text-slate-200">{selected.description || "Sin descripción"}</dd>
              </dl>
              <div>
                <p className="text-sm font-bold">Subdeportes asociados</p>
                {subs.length === 0 ? (
                  <p className="mt-2 text-sm text-slate-400">Este deporte no tiene subdeportes.</p>
                ) : (
                  <ul className="mt-3 flex flex-wrap gap-2">
                    {subs.map((sub) => (
                      <li key={sub.id} className="rounded-full border border-[#245078] px-3 py-1 text-xs text-slate-200">
                        {sub.name}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="rounded-xl border border-white/10 px-3 py-4 text-center">
                  <p className="text-2xl font-black text-sky-300">{subs.length}</p>
                  <p className="text-xs text-slate-400">subdeportes asociados</p>
                </div>
                <div className="rounded-xl border border-white/10 px-3 py-4 text-center">
                  <p className="text-2xl font-black text-sky-300">{teamCount}</p>
                  <p className="text-xs text-slate-400">equipos asociados</p>
                </div>
              </div>
            </div>
          ) : (
            <EmptyNote>Selecciona o registra un deporte.</EmptyNote>
          )}
        </Panel>
      </div>
      {modalOpen && (
        <Modal title="Registrar / Editar deporte" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="Nombre del deporte" required error={errors.name}>
                <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} placeholder="Ej. Atletismo" />
              </Field>
              <Field label="Categoría" required error={errors.category}>
                <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value })} className={fieldClass(Boolean(errors.category))}>
                  <option value="">Selecciona una categoría</option>
                  {SPORT_CATEGORIES.map((category) => (
                    <option key={category} value={category}>{category}</option>
                  ))}
                </select>
              </Field>
              <Field label="Estado">
                <select value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as Status })} className={fieldClass()}>
                  <option value="activo">Activo</option>
                  <option value="inactivo">Inactivo</option>
                </select>
              </Field>
            </div>
            <Field label="Descripción">
              <textarea
                value={form.description}
                maxLength={250}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
                className={fieldClass()}
                rows={3}
                placeholder="Describe el deporte..."
              />
              <span className="mt-1 block text-right text-[11px] text-slate-500">{form.description.length}/250</span>
            </Field>
            <Field label="Agregar subdeporte" error={errors.sub}>
              <span className="mt-1.5 flex gap-2">
                <input value={draftSub} onChange={(event) => setDraftSub(event.target.value)} className={fieldClass()} placeholder="Ej. Marcha atlética" />
                <button type="button" onClick={addSub} className={ghostButtonClass}>+ Añadir</button>
              </span>
            </Field>
            <div>
              <p className="text-xs font-semibold text-slate-300">Subdeportes agregados ({form.subdeportes.length})</p>
              {form.subdeportes.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">Aún no has agregado subdeportes</p>
              ) : (
                <ul className="mt-2 flex flex-wrap gap-2">
                  {form.subdeportes.map((sub) => (
                    <li key={sub} className="inline-flex items-center gap-2 rounded-full border border-[#245078] px-3 py-1 text-xs">
                      {sub}
                      <button type="button" aria-label={`Quitar ${sub}`} onClick={() => setForm({ ...form, subdeportes: form.subdeportes.filter((item) => item !== sub) })}>×</button>
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <div className="flex justify-end gap-3">
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

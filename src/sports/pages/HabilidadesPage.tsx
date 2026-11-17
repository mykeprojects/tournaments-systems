import { useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import { routePaths } from "../../routes/routePaths";
import { useSportsCatalog } from "../SportsCatalogContext";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "../format";
import { SkillMark, StarIcon } from "../glyphs";
import { CATEGORY_TONE, SKILL_CATEGORIES, skillCategoryLabel } from "../options";
import { activeContract } from "../selectors";
import type { Skill, SkillCategory } from "../types";
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

type SkillForm = {
  id?: string;
  name: string;
  category: SkillCategory | "";
  description: string;
};

const emptyForm = (): SkillForm => ({ name: "", category: "", description: "" });

export default function HabilidadesPage() {
  const catalog = useSportsCatalog();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState<"todas" | SkillCategory>("todas");
  const [selectedId, setSelectedId] = useState("velocidad");
  const [modalOpen, setModalOpen] = useState(false);
  const [form, setForm] = useState<SkillForm>(emptyForm);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [notice, setNotice] = useState<Notice | null>(null);

  useEffect(() => {
    document.title = "Gestión de Habilidades · Sports System+";
  }, []);

  const filtered = catalog.skills.filter((skill) => {
    const matchesQuery = skill.name.toLocaleLowerCase("es").includes(query.trim().toLocaleLowerCase("es"));
    return matchesQuery && (category === "todas" || skill.category === category);
  });
  const paging = usePaged(filtered, 8, `${query}|${category}`);

  const selected = catalog.skills.find((skill) => skill.id === selectedId) ?? filtered[0] ?? null;
  const assignedPlayers = selected
    ? catalog.playerSkills.filter((link) => link.skillId === selected.id)
    : [];
  const relatedPlayers = catalog.players.filter((player) =>
    assignedPlayers.some((link) => link.playerId === player.id)
  );
  const teamCount = new Set(
    relatedPlayers
      .map((player) => activeContract(catalog.contracts, player.id)?.teamId)
      .filter((teamId): teamId is string => Boolean(teamId))
  ).size;
  const sportCount = new Set(relatedPlayers.map((player) => player.preferredSportId).filter(Boolean)).size;

  const openCreate = () => {
    setForm(emptyForm());
    setErrors({});
    setModalOpen(true);
  };

  const openEdit = (skill: Skill) => {
    setSelectedId(skill.id);
    setForm({ id: skill.id, name: skill.name, category: skill.category, description: skill.description });
    setErrors({});
    setModalOpen(true);
  };

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: Record<string, string> = {};
    if (!form.name.trim()) nextErrors.name = "Este campo es obligatorio.";
    if (!form.category) nextErrors.category = "Este campo es obligatorio.";
    if (!form.description.trim()) nextErrors.description = "Este campo es obligatorio.";
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0 || !form.category) {
      return;
    }
    const result = await catalog.saveSkill({
      id: form.id,
      name: form.name,
      category: form.category,
      description: form.description,
    });
    if (!result.ok) {
      setErrors({ name: result.message });
      return;
    }
    if (result.id) setSelectedId(result.id);
    setNotice({ tone: "ok", message: result.message });
    setModalOpen(false);
  };

  const handleDelete = async (skill: Skill) => {
    const count = catalog.playerSkills.filter((link) => link.skillId === skill.id).length;
    if (count > 0) {
      setNotice({
        tone: "error",
        title: "No se puede eliminar",
        message: `No se puede eliminar "${skill.name}" porque está asignada a ${count} ${count === 1 ? "jugador" : "jugadores"}.`,
      });
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar "${skill.name}"?`)) {
      return;
    }
    const result = await catalog.deleteSkill(skill.id);
    setNotice(result.ok ? { tone: "ok", message: result.message } : { tone: "error", message: result.message });
  };

  return (
    <div>
      <PageHeader
        icon={<StarIcon />}
        title="Gestión de Habilidades"
        subtitle="Administra el catálogo de capacidades deportivas disponibles para los jugadores."
        actions={
          <>
            <Link to={routePaths.sportsSkillAssign} className={ghostButtonClass}>Asignar a jugadores</Link>
            <button type="button" onClick={openCreate} className={primaryButtonClass}>+ Nueva habilidad</button>
          </>
        }
      />
      <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_220px]">
        <input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Buscar habilidad" aria-label="Buscar habilidad" className={fieldClass()} />
        <select value={category} onChange={(event) => setCategory(event.target.value as "todas" | SkillCategory)} aria-label="Filtrar por categoría" className={fieldClass()}>
          <option value="todas">Categoría: todas</option>
          {SKILL_CATEGORIES.map((item) => <option key={item} value={item}>{skillCategoryLabel(item)}</option>)}
        </select>
      </div>
      <div className="grid items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <Panel title="Catálogo de habilidades" extra={<span className="text-xs text-slate-400">{filtered.length} habilidades</span>}>
          {paging.total === 0 ? (
            <EmptyNote>No hay habilidades para esta búsqueda.</EmptyNote>
          ) : (
            <ul className="grid gap-3 p-4 sm:grid-cols-2 xl:grid-cols-4">
              {paging.current.map((skill) => {
                const count = catalog.playerSkills.filter((link) => link.skillId === skill.id).length;
                return (
                  <li
                    key={skill.id}
                    onClick={() => setSelectedId(skill.id)}
                    className={`cursor-pointer rounded-2xl border bg-[#06101c] p-4 ${selected?.id === skill.id ? "border-[#3dff7a]" : "border-[#1b3f63]"}`}
                  >
                    <span className={`mx-auto flex h-12 w-12 items-center justify-center rounded-full ${CATEGORY_TONE[skill.category]}`}>
                      <SkillMark glyph={skill.glyph} />
                    </span>
                    <p className="mt-3 text-center font-bold">{skill.name}</p>
                    <p className={`mx-auto mt-1 w-fit rounded-full px-2 py-0.5 text-[11px] ${CATEGORY_TONE[skill.category]}`}>{skillCategoryLabel(skill.category)}</p>
                    <p className="mt-2 text-center text-xs text-slate-400">{count} jugadores asociados</p>
                    <span className="mt-3 flex justify-center gap-2">
                      <IconButton label={`Ver ${skill.name}`} tone="view" onClick={() => setSelectedId(skill.id)} />
                      <IconButton label={`Editar ${skill.name}`} tone="edit" onClick={() => openEdit(skill)} />
                      <IconButton label={`Eliminar ${skill.name}`} tone="delete" onClick={() => handleDelete(skill)} />
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
          <Pager page={paging.page} pageCount={paging.pageCount} from={paging.from} to={paging.to} total={paging.total} onPage={paging.setPage} />
        </Panel>
        <Panel title="Detalle de la habilidad">
          {selected ? (
            <div className="space-y-4 p-4">
              <div className="flex items-center gap-3">
                <span className={`flex h-16 w-16 items-center justify-center rounded-full ${CATEGORY_TONE[selected.category]}`}>
                  <SkillMark glyph={selected.glyph} className="h-7 w-7" />
                </span>
                <div>
                  <h3 className="text-xl font-black">{selected.name}</h3>
                  <span className={`rounded-full px-2 py-0.5 text-xs ${CATEGORY_TONE[selected.category]}`}>{skillCategoryLabel(selected.category)}</span>
                </div>
              </div>
              <p className="text-sm leading-6 text-slate-300">{selected.description}</p>
              <div className="rounded-xl border border-white/10 px-3 py-4 text-center">
                <p className="text-3xl font-black text-sky-300">{assignedPlayers.length}</p>
                <p className="text-xs text-slate-400">jugadores asociados</p>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center text-xs">
                <div className="rounded-xl border border-white/10 py-3"><p className="text-lg font-black">{sportCount}</p><p className="text-slate-400">Deportes</p></div>
                <div className="rounded-xl border border-white/10 py-3"><p className="text-lg font-black">{teamCount}</p><p className="text-slate-400">Equipos</p></div>
                <div className="rounded-xl border border-white/10 py-3"><p className="text-lg font-black">{assignedPlayers.length}</p><p className="text-slate-400">Jugadores</p></div>
              </div>
            </div>
          ) : (
            <EmptyNote>Selecciona o registra una habilidad.</EmptyNote>
          )}
        </Panel>
      </div>
      {modalOpen && (
        <Modal title="Registrar / Editar habilidad" onClose={() => setModalOpen(false)}>
          <form onSubmit={handleSave} className="space-y-4">
            <Field label="Nombre" required error={errors.name}>
              <input value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })} className={fieldClass(Boolean(errors.name))} />
            </Field>
            <Field label="Categoría" required error={errors.category}>
              <select value={form.category} onChange={(event) => setForm({ ...form, category: event.target.value as SkillCategory | "" })} className={fieldClass(Boolean(errors.category))}>
                <option value="">Selecciona una categoría</option>
                {SKILL_CATEGORIES.map((item) => <option key={item} value={item}>{skillCategoryLabel(item)}</option>)}
              </select>
            </Field>
            <Field label="Descripción" required error={errors.description}>
              <textarea value={form.description} onChange={(event) => setForm({ ...form, description: event.target.value })} className={fieldClass(Boolean(errors.description))} rows={3} />
            </Field>
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

import { useState, type FormEvent } from "react";
import type { MatchAnnotation, MatchParticipantPlayer } from "../../models/matches";
import type { MatchAnnotationInput } from "../../services/matchManagementService";
import { Avatar, EmptyNote, Field, Panel } from "../../sports/ui";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "../../sports/format";

type AnnotationDraft = {
  playerId: string;
  minute: string;
  description: string;
};

const emptyDraft = (): AnnotationDraft => ({ playerId: "", minute: "", description: "" });

function toInput(draft: AnnotationDraft): MatchAnnotationInput {
  return {
    playerId: Number(draft.playerId),
    ...(draft.minute === "" ? {} : { minute: Number(draft.minute) }),
    description: draft.description.trim(),
  };
}

export default function MatchAnnotations({
  annotations,
  players,
  disabled,
  saving,
  deletingId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  annotations: MatchAnnotation[];
  players: MatchParticipantPlayer[];
  disabled: boolean;
  saving: boolean;
  deletingId: number | null;
  onCreate: (input: MatchAnnotationInput) => Promise<boolean>;
  onUpdate: (id: number, input: MatchAnnotationInput) => Promise<boolean>;
  onDelete: (annotation: MatchAnnotation) => void;
}) {
  const [draft, setDraft] = useState<AnnotationDraft>(emptyDraft);
  const [editing, setEditing] = useState<MatchAnnotation | null>(null);
  const [editDraft, setEditDraft] = useState<AnnotationDraft>(emptyDraft);

  const submitNew = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onCreate(toInput(draft))) setDraft(emptyDraft());
  };

  const startEditing = (annotation: MatchAnnotation) => {
    setEditing(annotation);
    setEditDraft({
      playerId: String(annotation.playerId),
      minute: annotation.minute == null ? "" : String(annotation.minute),
      description: annotation.description,
    });
  };

  const submitEdit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    if (await onUpdate(editing.id, toInput(editDraft))) setEditing(null);
  };

  return (
    <Panel title="Anotaciones del partido">
      {!disabled && (
        <form onSubmit={submitNew} className="grid gap-3 border-b border-white/5 p-4 sm:grid-cols-2">
          <Field label="Jugador participante" required>
            <select
              value={draft.playerId}
              onChange={(event) => setDraft((current) => ({ ...current, playerId: event.target.value }))}
              className={fieldClass()}
              required
            >
              <option value="">Selecciona un jugador</option>
              {players.map((player) => (
                <option key={player.id} value={player.id}>
                  {player.fullName} · {player.position}
                </option>
              ))}
            </select>
          </Field>
          <Field label="Minuto">
            <input
              type="number"
              min="0"
              max="999"
              value={draft.minute}
              onChange={(event) => setDraft((current) => ({ ...current, minute: event.target.value }))}
              className={fieldClass()}
              placeholder="Opcional"
            />
          </Field>
          <div className="sm:col-span-2">
            <Field label="Descripción" required>
              <textarea
                value={draft.description}
                onChange={(event) =>
                  setDraft((current) => ({ ...current, description: event.target.value }))
                }
                className={fieldClass()}
                maxLength={250}
                rows={2}
                required
              />
            </Field>
          </div>
          <div className="flex justify-end sm:col-span-2">
            <button
              type="submit"
              className={primaryButtonClass}
              disabled={saving || players.length === 0}
            >
              {saving ? "Guardando…" : "Agregar anotación"}
            </button>
          </div>
          {players.length === 0 && (
            <p className="text-xs text-amber-200 sm:col-span-2">
              No hay jugadores con plantilla activa en los equipos participantes.
            </p>
          )}
        </form>
      )}
      {disabled && (
        <p className="border-b border-white/5 px-4 py-3 text-xs text-amber-200">
          No se pueden agregar ni modificar anotaciones en un partido cancelado. Las anotaciones existentes sí se pueden eliminar.
        </p>
      )}
      {annotations.length === 0 ? (
        <EmptyNote>No hay anotaciones registradas para este partido.</EmptyNote>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[700px] text-left text-sm">
            <thead>
              <tr className="text-[11px] uppercase tracking-wide text-slate-400">
                <th className="px-4 py-3 font-semibold">Minuto</th>
                <th className="px-3 py-3 font-semibold">Jugador</th>
                <th className="px-3 py-3 font-semibold">Descripción</th>
                <th className="px-3 py-3 font-semibold">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {annotations.map((annotation) => {
                const player = players.find((item) => item.id === annotation.playerId);
                const isEditing = editing?.id === annotation.id;
                return (
                  <tr key={annotation.id} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3">{annotation.minute == null ? "—" : `${annotation.minute}'`}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={player?.fullName ?? `Jugador #${annotation.playerId}`} />
                        {player?.fullName ?? `Jugador #${annotation.playerId}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {isEditing ? (
                        <form id={`annotation-edit-${annotation.id}`} onSubmit={submitEdit} className="grid gap-3">
                          <select
                            value={editDraft.playerId}
                            onChange={(event) =>
                              setEditDraft((current) => ({ ...current, playerId: event.target.value }))
                            }
                            className={fieldClass()}
                            required
                          >
                            {players.map((participant) => (
                              <option key={participant.id} value={participant.id}>
                                {participant.fullName} · {participant.position}
                              </option>
                            ))}
                          </select>
                          <input
                            type="number"
                            min="0"
                            max="999"
                            value={editDraft.minute}
                            onChange={(event) =>
                              setEditDraft((current) => ({ ...current, minute: event.target.value }))
                            }
                            className={fieldClass()}
                            placeholder="Minuto opcional"
                          />
                          <textarea
                            value={editDraft.description}
                            onChange={(event) =>
                              setEditDraft((current) => ({ ...current, description: event.target.value }))
                            }
                            className={fieldClass()}
                            maxLength={250}
                            rows={2}
                            required
                          />
                        </form>
                      ) : annotation.description}
                    </td>
                    <td className="px-3 py-3">
                      <div className="flex gap-2">
                        {isEditing ? (
                          <>
                            <button
                              type="submit"
                              form={`annotation-edit-${annotation.id}`}
                              className={primaryButtonClass}
                              disabled={saving}
                            >
                              Guardar
                            </button>
                            <button type="button" className={ghostButtonClass} onClick={() => setEditing(null)}>
                              Cancelar
                            </button>
                          </>
                        ) : (
                          <>
                            {!disabled && (
                              <button
                                type="button"
                                className={ghostButtonClass}
                                onClick={() => startEditing(annotation)}
                              >
                                Editar
                              </button>
                            )}
                            <button
                              type="button"
                              className="rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-200 hover:bg-red-400/10 disabled:opacity-50"
                              onClick={() => onDelete(annotation)}
                              disabled={deletingId === annotation.id}
                            >
                              {deletingId === annotation.id ? "Eliminando…" : "Eliminar"}
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </Panel>
  );
}

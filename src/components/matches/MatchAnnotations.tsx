import { useState, type FormEvent } from "react";
import type { MatchAnnotation, MatchParticipantPlayer } from "../../models/matches";
import type { MatchAnnotationInput } from "../../services/matchManagementService";
import { Avatar, EmptyNote, Field, Panel } from "../../sports/ui";
import { fieldClass, ghostButtonClass, primaryButtonClass } from "../../sports/format";

type AnnotationDraft = {
  teamId: string;
  playerId: string;
  minute: string;
  description: string;
};

const emptyDraft = (): AnnotationDraft => ({ teamId: "", playerId: "", minute: "", description: "" });

type AnnotationTeam = {
  id: number;
  name: string;
  players: MatchParticipantPlayer[];
};

function toInput(draft: AnnotationDraft): MatchAnnotationInput {
  return {
    playerId: Number(draft.playerId),
    ...(draft.minute === "" ? {} : { minute: Number(draft.minute) }),
    description: draft.description.trim(),
  };
}

export default function MatchAnnotations({
  annotations,
  homeTeam,
  awayTeam,
  disabled,
  saving,
  deletingId,
  onCreate,
  onUpdate,
  onDelete,
}: {
  annotations: MatchAnnotation[];
  homeTeam: AnnotationTeam;
  awayTeam: AnnotationTeam;
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
  const teams = [homeTeam, awayTeam];
  const playersForTeam = (teamId: string) =>
    teams.find((team) => String(team.id) === teamId)?.players ?? [];
  const allPlayers = [...homeTeam.players, ...awayTeam.players];

  const submitNew = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (await onCreate(toInput(draft))) setDraft(emptyDraft());
  };

  const startEditing = (annotation: MatchAnnotation) => {
    setEditing(annotation);
    const teamId = String(annotation.teamId);
    setEditDraft({
      teamId,
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
          <Field label="Equipo participante" required>
            <select
              value={draft.teamId}
              onChange={(event) =>
                setDraft((current) => ({ ...current, teamId: event.target.value, playerId: "" }))
              }
              className={fieldClass()}
              required
            >
              <option value="">Selecciona un equipo</option>
              {teams.map((team) => (
                <option key={team.id} value={team.id}>{team.name}</option>
              ))}
            </select>
          </Field>
          <Field label="Jugador participante" required>
            <select
              value={draft.playerId}
              onChange={(event) => setDraft((current) => ({ ...current, playerId: event.target.value }))}
              className={fieldClass()}
              required
              disabled={!draft.teamId}
            >
              <option value="">
                {draft.teamId ? "Selecciona un jugador" : "Primero selecciona un equipo"}
              </option>
              {playersForTeam(draft.teamId).map((player) => (
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
              disabled={saving || allPlayers.length === 0 || !draft.teamId || !draft.playerId}
            >
              {saving ? "Guardando…" : "Agregar anotación"}
            </button>
          </div>
          {allPlayers.length === 0 && (
            <p className="text-xs text-amber-200 sm:col-span-2">
              No hay jugadores con plantilla activa en los equipos participantes.
            </p>
          )}
        </form>
      )}
      {disabled && (
        <p className="border-b border-white/5 px-4 py-3 text-xs text-amber-200">
          Las anotaciones solo se pueden agregar, modificar o eliminar mientras el partido está en juego.
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
                const player = allPlayers.find((item) => item.id === annotation.playerId);
                const team = teams.find((item) => item.id === annotation.teamId);
                const isEditing = editing?.id === annotation.id;
                return (
                  <tr key={annotation.id} className="border-t border-white/5 align-top">
                    <td className="px-4 py-3">{annotation.minute == null ? "—" : `${annotation.minute}'`}</td>
                    <td className="px-3 py-3">
                      <span className="flex items-center gap-2">
                        <Avatar name={player?.fullName ?? `Jugador #${annotation.playerId}`} />
                        {team?.name ? `${team.name} · ` : ""}{player?.fullName ?? `Jugador #${annotation.playerId}`}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-slate-300">
                      {isEditing ? (
                        <form id={`annotation-edit-${annotation.id}`} onSubmit={submitEdit} className="grid gap-3">
                          <select
                            value={editDraft.teamId}
                            onChange={(event) =>
                              setEditDraft((current) => ({ ...current, teamId: event.target.value, playerId: "" }))
                            }
                            className={fieldClass()}
                            required
                          >
                            {teams.map((participantTeam) => (
                              <option key={participantTeam.id} value={participantTeam.id}>
                                {participantTeam.name}
                              </option>
                            ))}
                          </select>
                          <select
                            value={editDraft.playerId}
                            onChange={(event) =>
                              setEditDraft((current) => ({ ...current, playerId: event.target.value }))
                            }
                            className={fieldClass()}
                            required
                          >
                            {playersForTeam(editDraft.teamId).map((participant) => (
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
                              disabled={disabled || deletingId === annotation.id}
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

import { useState, type FormEvent } from "react";
import {
  defaultBaseUrlForModel,
  permissionDraftsForResource,
  SUGGESTED_PERMISSION_MODELS,
  validateCreateResourcePermissions,
} from "../../domain/authorization/createPermission";
import {
  MATRIX_ACTIONS,
  type PermissionAction,
} from "../../domain/authorization/permissionMatrix";
import { createPermission } from "../../services/roleService";
import { getUserServiceErrorMessage } from "../../services/userService";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1711] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

type CreatePermissionFormProps = {
  onClose: () => void;
  onCreated: (summary: string) => Promise<void> | void;
};

const CreatePermissionForm = ({ onClose, onCreated }: CreatePermissionFormProps) => {
  const [model, setModel] = useState("");
  const [baseUrl, setBaseUrl] = useState("/api/");
  const [isUrlEdited, setIsUrlEdited] = useState(false);
  const [actions, setActions] = useState<PermissionAction[]>([...MATRIX_ACTIONS]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const drafts = permissionDraftsForResource(model, baseUrl, actions);

  const handleModelChange = (value: string) => {
    setModel(value);
    if (!isUrlEdited) {
      setBaseUrl(defaultBaseUrlForModel(value));
    }
  };

  const toggleAction = (action: PermissionAction) => {
    setActions((current) =>
      current.includes(action)
        ? current.filter((item) => item !== action)
        : [...MATRIX_ACTIONS.filter((item) => [...current, action].includes(item))]
    );
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const validationError = validateCreateResourcePermissions({
      model,
      baseUrl,
      actions,
    });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    const created: string[] = [];
    const failed: string[] = [];

    try {
      for (const draft of permissionDraftsForResource(model, baseUrl, actions)) {
        try {
          await createPermission(draft);
          created.push(`${draft.method} ${draft.url}`);
        } catch (saveError) {
          failed.push(
            `${draft.method} ${draft.url}: ${getUserServiceErrorMessage(
              saveError,
              "No fue posible registrarlo."
            )}`
          );
        }
      }

      if (created.length === 0) {
        setError(
          failed.join(" ") ||
            "No fue posible registrar los permisos de este recurso."
        );
        return;
      }

      const summary =
        failed.length === 0
          ? `Se registraron ${created.length} permiso(s) de ${model.trim()} y ya están en la matriz.`
          : `Se registraron ${created.length} permiso(s). No se crearon: ${failed.join(" ")}`;
      await onCreated(summary);
      onClose();
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="create-permission-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1711] text-white shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-slate-800 px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
            Catálogo
          </p>
          <h2 id="create-permission-title" className="mt-2 text-2xl font-black">
            Crear permisos de un recurso
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Un recurso puede tener varias operaciones. Cada una se guarda como un
            permiso distinto (método + URL).
          </p>
        </div>

        <form
          onSubmit={(event) => void handleSubmit(event)}
          className="max-h-[75vh] space-y-5 overflow-y-auto px-6 py-6"
        >
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          <div>
            <label htmlFor="permission-model" className="text-sm font-semibold text-slate-200">
              Modelo o recurso
            </label>
            <input
              id="permission-model"
              list="permission-models"
              value={model}
              onChange={(event) => handleModelChange(event.target.value)}
              className={INPUT_CLASS}
              placeholder="pizzas"
              maxLength={100}
              required
            />
            <datalist id="permission-models">
              {SUGGESTED_PERMISSION_MODELS.map((suggestedModel) => (
                <option key={suggestedModel} value={suggestedModel} />
              ))}
            </datalist>
            <p className="mt-2 text-xs text-slate-500">
              Agrupa la fila de la matriz. Ejemplo: pizzas, tournaments, users.
            </p>
          </div>

          <div>
            <label htmlFor="permission-url" className="text-sm font-semibold text-slate-200">
              URL base del recurso
            </label>
            <input
              id="permission-url"
              value={baseUrl}
              onChange={(event) => {
                setIsUrlEdited(true);
                setBaseUrl(event.target.value);
              }}
              className={INPUT_CLASS}
              placeholder="/api/pizzas"
              maxLength={255}
              required
            />
            <p className="mt-2 text-xs text-slate-500">
              No uses solo /api/. Cada operación genera su propia ruta a partir de esta.
            </p>
          </div>

          <fieldset>
            <legend className="text-sm font-semibold text-slate-200">
              Operaciones
            </legend>
            <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {MATRIX_ACTIONS.map((action) => (
                <label
                  key={action}
                  className="flex cursor-pointer items-center gap-2 rounded-xl border border-slate-800 px-3 py-2.5 text-sm text-slate-200 hover:border-lime-400/30"
                >
                  <input
                    type="checkbox"
                    checked={actions.includes(action)}
                    onChange={() => toggleAction(action)}
                    className="accent-lime-400"
                  />
                  {action}
                </label>
              ))}
            </div>
          </fieldset>

          {drafts.length > 0 && (
            <div className="rounded-xl border border-slate-800 bg-[#07110d] px-4 py-3">
              <p className="text-xs font-semibold uppercase tracking-[0.16em] text-slate-500">
                Permisos que se van a crear
              </p>
              <ul className="mt-2 space-y-1 font-mono text-xs text-slate-300">
                {drafts.map((draft) => (
                  <li key={`${draft.method}-${draft.url}`}>
                    {draft.method} {draft.url}
                  </li>
                ))}
              </ul>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:opacity-60"
            >
              {isSaving ? "Registrando..." : "Registrar permisos"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default CreatePermissionForm;

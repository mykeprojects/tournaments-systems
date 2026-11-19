import { useMemo, useState, type FormEvent } from "react";
import {
  PERMISSION_HTTP_METHODS,
  SUGGESTED_PERMISSION_MODELS,
  validateCreatePermission,
} from "../../domain/authorization/createPermission";
import {
  deletePermission,
  updatePermission,
} from "../../services/roleService";
import { getUserServiceErrorMessage } from "../../services/userService";
import type { Permission } from "../../models/authorization";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[#245078] bg-[#071321] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#3dff7a] focus:ring-2 focus:ring-[#3dff7a]/20";

type EditPermissionFormProps = {
  permissions: Permission[];
  initialPermission?: Permission | null;
  canDelete: boolean;
  onClose: () => void;
  onUpdated: (summary: string) => Promise<void> | void;
};

const permissionLabel = (permission: Permission): string =>
  `${permission.method} ${permission.url}${
    permission.model ? ` · ${permission.model}` : ""
  }`;

const EditPermissionForm = ({
  permissions,
  initialPermission,
  canDelete,
  onClose,
  onUpdated,
}: EditPermissionFormProps) => {
  const catalog = useMemo(
    () =>
      [...permissions].sort(
        (left, right) =>
          (left.model ?? "").localeCompare(right.model ?? "") ||
          left.method.localeCompare(right.method) ||
          left.url.localeCompare(right.url)
      ),
    [permissions]
  );
  const [selectedId, setSelectedId] = useState(
    initialPermission?.id ?? catalog[0]?.id ?? null
  );
  const selectedPermission =
    catalog.find((permission) => permission.id === selectedId) ?? null;
  const [method, setMethod] = useState(selectedPermission?.method ?? "GET");
  const [url, setUrl] = useState(selectedPermission?.url ?? "");
  const [model, setModel] = useState(selectedPermission?.model ?? "");
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const isBusy = isSaving;

  const applyPermission = (permission: Permission) => {
    setSelectedId(permission.id);
    setMethod(permission.method);
    setUrl(permission.url);
    setModel(permission.model ?? "");
    setError(null);
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (selectedId === null) {
      setError("Selecciona el permiso que deseas editar.");
      return;
    }
    const validationError = validateCreatePermission({ method, url, model });
    if (validationError) {
      setError(validationError);
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      const updated = await updatePermission(selectedId, {
        method: method.trim().toUpperCase(),
        url: url.trim(),
        model: model.trim(),
      });
      await onUpdated(
        `El permiso ${updated.method} ${updated.url} se actualizó correctamente.`
      );
      onClose();
    } catch (saveError) {
      setError(
        getUserServiceErrorMessage(
          saveError,
          "No fue posible actualizar el permiso."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    if (selectedPermission === null) {
      setError("Selecciona el permiso que deseas eliminar.");
      return;
    }
    if (
      !window.confirm(
        `¿Eliminar ${selectedPermission.method} ${selectedPermission.url}? Se retirará de todos los roles, pero los roles no se borran.`
      )
    ) {
      return;
    }

    setIsSaving(true);
    setError(null);
    try {
      await deletePermission(selectedPermission.id);
      await onUpdated(
        `El permiso ${selectedPermission.method} ${selectedPermission.url} se eliminó del catálogo.`
      );
      onClose();
    } catch (deleteError) {
      setError(
        getUserServiceErrorMessage(
          deleteError,
          "No fue posible eliminar el permiso."
        )
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isBusy) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="edit-permission-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#245078] bg-[#071321] text-white shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-[#1b3f63] px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3dff7a]">
            Catálogo
          </p>
          <h2 id="edit-permission-title" className="mt-2 text-2xl font-black">
            Editar permiso
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            Cambia el método, la URL o el modelo. Los roles que ya lo tienen
            asignado conservan ese permiso.
          </p>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="space-y-5 px-6 py-6">
          {error && (
            <p
              role="alert"
              className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
            >
              {error}
            </p>
          )}

          {catalog.length === 0 ? (
            <p className="rounded-xl border border-[#1b3f63] px-4 py-5 text-sm text-slate-400">
              No hay permisos registrados para editar.
            </p>
          ) : (
            <>
              <div>
                <label htmlFor="permission-to-edit" className="text-sm font-semibold text-slate-200">
                  Permiso
                </label>
                <select
                  id="permission-to-edit"
                  value={selectedId ?? ""}
                  onChange={(event) => {
                    const permission = catalog.find(
                      (item) => item.id === Number(event.target.value)
                    );
                    if (permission) {
                      applyPermission(permission);
                    }
                  }}
                  className={INPUT_CLASS}
                >
                  {catalog.map((permission) => (
                    <option key={permission.id} value={permission.id}>
                      {permissionLabel(permission)}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-permission-method" className="text-sm font-semibold text-slate-200">
                  Operación (método HTTP)
                </label>
                <select
                  id="edit-permission-method"
                  value={method}
                  onChange={(event) => setMethod(event.target.value)}
                  className={INPUT_CLASS}
                >
                  {PERMISSION_HTTP_METHODS.map((httpMethod) => (
                    <option key={httpMethod} value={httpMethod}>
                      {httpMethod}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label htmlFor="edit-permission-url" className="text-sm font-semibold text-slate-200">
                  URL del recurso
                </label>
                <input
                  id="edit-permission-url"
                  value={url}
                  onChange={(event) => setUrl(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="/api/users/{id}"
                  maxLength={255}
                  required
                />
              </div>

              <div>
                <label htmlFor="edit-permission-model" className="text-sm font-semibold text-slate-200">
                  Modelo o recurso
                </label>
                <input
                  id="edit-permission-model"
                  list="edit-permission-models"
                  value={model}
                  onChange={(event) => setModel(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="users"
                  maxLength={100}
                  required
                />
                <datalist id="edit-permission-models">
                  {SUGGESTED_PERMISSION_MODELS.map((suggestedModel) => (
                    <option key={suggestedModel} value={suggestedModel} />
                  ))}
                </datalist>
              </div>
            </>
          )}

          <div className="flex flex-wrap justify-end gap-3 pt-2">
            {canDelete && (
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isBusy || catalog.length === 0}
                className="mr-auto rounded-xl border border-red-500/40 px-5 py-3 text-sm font-semibold text-red-200 transition hover:bg-red-500/10 disabled:opacity-50"
              >
                {isBusy ? "Procesando..." : "Eliminar"}
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              disabled={isBusy}
              className="rounded-xl border border-[#245078] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isBusy || catalog.length === 0}
              className="rounded-xl bg-[#3dff7a] px-5 py-3 text-sm font-extrabold text-[#04210f] transition hover:bg-[#62ff96] disabled:opacity-60"
            >
              {isBusy ? "Guardando..." : "Guardar permiso"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default EditPermissionForm;

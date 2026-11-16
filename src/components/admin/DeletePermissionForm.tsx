import { useMemo, useState, type FormEvent } from "react";
import {
  deletePermission,
  type Permission,
} from "../../services/roleService";
import { getUserServiceErrorMessage } from "../../services/userService";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[#245078] bg-[#071321] px-4 py-3 text-sm text-white outline-none transition focus:border-[#3dff7a] focus:ring-2 focus:ring-[#3dff7a]/20";

type DeletePermissionFormProps = {
  permissions: Permission[];
  initialPermission?: Permission | null;
  onClose: () => void;
  onDeleted: (summary: string) => Promise<void> | void;
};

const permissionLabel = (permission: Permission): string =>
  `${permission.method} ${permission.url}${
    permission.model ? ` · ${permission.model}` : ""
  }`;

const DeletePermissionForm = ({
  permissions,
  initialPermission,
  onClose,
  onDeleted,
}: DeletePermissionFormProps) => {
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
  const [error, setError] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
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

    setIsDeleting(true);
    setError(null);
    try {
      await deletePermission(selectedPermission.id);
      await onDeleted(
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
      setIsDeleting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isDeleting) {
          onClose();
        }
      }}
    >
      <section
        aria-labelledby="delete-permission-title"
        aria-modal="true"
        className="w-full max-w-lg overflow-hidden rounded-2xl border border-[#245078] bg-[#071321] text-white shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-[#1b3f63] px-6 py-5">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3dff7a]">
            Catálogo
          </p>
          <h2 id="delete-permission-title" className="mt-2 text-2xl font-black">
            Eliminar permiso
          </h2>
          <p className="mt-2 text-sm text-slate-400">
            El permiso sale del sistema y se retira de los roles que lo tenían.
            Los roles no se eliminan.
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
              No hay permisos registrados para eliminar.
            </p>
          ) : (
            <div>
              <label htmlFor="permission-to-delete" className="text-sm font-semibold text-slate-200">
                Permiso
              </label>
              <select
                id="permission-to-delete"
                value={selectedId ?? ""}
                onChange={(event) => setSelectedId(Number(event.target.value))}
                className={INPUT_CLASS}
              >
                {catalog.map((permission) => (
                  <option key={permission.id} value={permission.id}>
                    {permissionLabel(permission)}
                  </option>
                ))}
              </select>
            </div>
          )}

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              disabled={isDeleting}
              className="rounded-xl border border-[#245078] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isDeleting || catalog.length === 0}
              className="rounded-xl border border-red-500/40 bg-red-500/10 px-5 py-3 text-sm font-extrabold text-red-200 transition hover:bg-red-500/20 disabled:opacity-60"
            >
              {isDeleting ? "Eliminando..." : "Eliminar permiso"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

export default DeletePermissionForm;

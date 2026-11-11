import type { Permission, RolePermissionAssignment } from "../../services/roleService";
import type { Role } from "../../services/userService";
import {
  MATRIX_ACTIONS,
  assignedPermissionIdsForRole,
  buildPermissionMatrix,
  isMatrixCellChecked,
  summarizeRoleMatrix,
} from "../../domain/authorization/permissionMatrix";
import { isAdministratorRole } from "../../services/roleService";
import Icon from "../icons/Icon";
import { iconForResource } from "./permissionMatrixIcons";

type RolePermissionMatrixProps = {
  roles: Role[];
  permissions: Permission[];
  assignments: RolePermissionAssignment[];
  selectedRoleId: number | null;
  selectedPermissionIds: number[];
  assignedUsers: number;
  isLoading: boolean;
  isRefreshing: boolean;
  isSaving: boolean;
  isDirty: boolean;
  canAssign: boolean;
  canCreatePermissions: boolean;
  canEditPermissions: boolean;
  canDeletePermissions: boolean;
  successMessage: string | null;
  errorMessage: string | null;
  onSelectRole: (roleId: number) => void;
  onToggleCell: (permissionIds: number[]) => void;
  onLoad: () => void;
  onSave: () => void;
  onReset: () => void;
  onCreatePermission: () => void;
  onEditPermission: (permission?: Permission) => void;
  onDeletePermission: (permission?: Permission) => void;
};

const TOOLBAR_BUTTON =
  "inline-flex h-11 w-full items-center justify-center gap-2 rounded-xl px-3 text-sm font-semibold transition disabled:cursor-not-allowed disabled:opacity-50";

const MatrixCheck = ({
  checked,
  disabled,
  unavailable,
  onToggle,
  label,
}: {
  checked: boolean;
  disabled: boolean;
  unavailable: boolean;
  onToggle: () => void;
  label: string;
}) => (
  <button
    type="button"
    role="checkbox"
    aria-checked={unavailable ? false : checked}
    aria-label={label}
    disabled={disabled || unavailable}
    onClick={onToggle}
    title={
      unavailable
        ? "Este permiso aún no existe en el catálogo"
        : checked
          ? "Permiso asignado"
          : "Permiso no asignado"
    }
    className={`mx-auto flex h-8 w-8 items-center justify-center rounded-md border transition ${
      unavailable
        ? "cursor-not-allowed border-slate-800 bg-transparent text-slate-700"
        : checked
          ? "border-lime-400/70 bg-lime-400 text-[#102016] shadow-[0_0_12px_rgba(163,230,53,0.35)]"
          : "border-slate-600 bg-transparent text-slate-500 hover:border-lime-400/50"
    } disabled:cursor-not-allowed disabled:opacity-70`}
  >
    {!unavailable && checked && <Icon name="check" className="h-4 w-4" />}
  </button>
);

const RolePermissionMatrix = ({
  roles,
  permissions,
  assignments,
  selectedRoleId,
  selectedPermissionIds,
  assignedUsers,
  isLoading,
  isRefreshing,
  isSaving,
  isDirty,
  canAssign,
  canCreatePermissions,
  canEditPermissions,
  canDeletePermissions,
  successMessage,
  errorMessage,
  onSelectRole,
  onToggleCell,
  onLoad,
  onSave,
  onReset,
  onCreatePermission,
  onEditPermission,
  onDeletePermission,
}: RolePermissionMatrixProps) => {
  const selectedRole = roles.find((role) => role.id === selectedRoleId) ?? null;
  const isAdministrator = isAdministratorRole(selectedRole);
  const canEditMatrix = canAssign && !isAdministrator && selectedRole !== null;
  const matrix = buildPermissionMatrix(permissions);
  const summary = summarizeRoleMatrix(matrix, selectedPermissionIds);
  const persistedIds = selectedRole
    ? assignedPermissionIdsForRole(selectedRole.id, assignments)
    : [];
  const pendingChanges = Math.abs(
    selectedPermissionIds.length - persistedIds.length
  );

  return (
    <section className="mt-8 grid gap-6 xl:grid-cols-[minmax(0,1fr)_20.5rem]">
      <div className="min-w-0">
        <div className="rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-6">
          <label
            htmlFor="selected-role"
            className="text-sm font-semibold text-slate-200"
          >
            Rol seleccionado
          </label>
          <select
            id="selected-role"
            value={selectedRoleId ?? ""}
            onChange={(event) => onSelectRole(Number(event.target.value))}
            disabled={roles.length === 0}
            className="mt-2 h-11 w-full rounded-xl border border-slate-700 bg-[#07110d] px-4 text-sm text-white outline-none transition focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20"
          >
            {roles.length === 0 ? (
              <option value="">Sin roles registrados</option>
            ) : (
              roles.map((role) => (
                <option key={role.id} value={role.id}>
                  {role.name}
                </option>
              ))
            )}
          </select>

          <div className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-[repeat(auto-fit,minmax(10rem,1fr))]">
            <button
              type="button"
              onClick={onLoad}
              disabled={isRefreshing || isSaving}
              title="Vuelve a consultar el catálogo y los permisos asignados al rol"
              className={`${TOOLBAR_BUTTON} border border-slate-500 text-white hover:border-lime-400/60 hover:bg-white/[0.04]`}
            >
              <Icon name="download" className="h-4 w-4" />
              {isRefreshing ? "Cargando..." : "Cargar permisos"}
            </button>
            {canCreatePermissions && (
              <button
                type="button"
                onClick={onCreatePermission}
                className={`${TOOLBAR_BUTTON} border border-lime-400/30 text-lime-200 hover:bg-lime-400/10`}
              >
                <Icon name="plus" className="h-4 w-4" />
                Crear permiso
              </button>
            )}
            {canEditPermissions && (
              <button
                type="button"
                onClick={() => onEditPermission()}
                disabled={permissions.length === 0}
                className={`${TOOLBAR_BUTTON} border border-lime-400/30 text-lime-200 hover:bg-lime-400/10`}
              >
                <Icon name="pencil" className="h-4 w-4" />
                Editar permiso
              </button>
            )}
            {canDeletePermissions && (
              <button
                type="button"
                onClick={() => onDeletePermission()}
                disabled={permissions.length === 0}
                className={`${TOOLBAR_BUTTON} border border-red-500/40 text-red-200 hover:bg-red-500/10`}
              >
                <Icon name="trash" className="h-4 w-4" />
                Eliminar permiso
              </button>
            )}
            <button
              type="button"
              onClick={onSave}
              disabled={!canEditMatrix || !isDirty || isSaving}
              className={`${TOOLBAR_BUTTON} bg-lime-400 font-extrabold text-[#102016] hover:bg-lime-300`}
            >
              <Icon name="save" className="h-4 w-4" />
              {isSaving ? "Guardando..." : "Guardar cambios"}
            </button>
            <button
              type="button"
              onClick={onReset}
              disabled={!isDirty || isSaving}
              className={`${TOOLBAR_BUTTON} border border-slate-600 text-slate-200 hover:border-slate-400`}
            >
              <Icon name="reset" className="h-4 w-4" />
              Restablecer
            </button>
          </div>

          <div className="mt-4 space-y-3">
            {successMessage && (
              <p
                role="status"
                className="flex items-center gap-2 rounded-xl border border-lime-400/30 bg-lime-400/10 px-4 py-3 text-sm text-lime-200"
              >
                <Icon name="check" className="h-4 w-4 shrink-0" />
                {successMessage}
              </p>
            )}
            {errorMessage && (
              <p
                role="alert"
                className="flex items-center gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300"
              >
                <Icon name="warning" className="h-4 w-4 shrink-0" />
                {errorMessage}
              </p>
            )}
            {isAdministrator && (
              <p className="flex items-start gap-2 rounded-xl border border-amber-400/20 bg-amber-400/10 px-4 py-3 text-sm text-amber-200">
                <Icon name="shield" className="mt-0.5 h-4 w-4 shrink-0" />
                El rol administrador conserva el catálogo completo y no se puede
                modificar desde la matriz.
              </p>
            )}
            <p className="flex items-start gap-2 rounded-xl border border-sky-400/20 bg-sky-400/10 px-4 py-3 text-sm text-sky-100">
              <Icon name="info" className="mt-0.5 h-4 w-4 shrink-0" />
              Los permisos seleccionados se conservarán después de cerrar e iniciar
              sesión nuevamente.
            </p>
          </div>
        </div>

        <div className="mt-6 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1711]">
          <div className="border-b border-slate-800 px-5 py-4 sm:px-6">
            <h2 className="text-lg font-black text-lime-300">
              Matriz de permisos del rol
            </h2>
          </div>

          {isLoading ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Cargando matriz de permisos...
            </p>
          ) : permissions.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              No hay permisos registrados. Créalos para poder asignarlos a un rol.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[720px] text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-400">
                  <tr>
                    <th scope="col" className="px-5 py-4 font-semibold sm:px-6">
                      Recurso
                    </th>
                    {MATRIX_ACTIONS.map((action) => (
                      <th
                        key={action}
                        scope="col"
                        className="px-3 py-4 text-center font-semibold"
                      >
                        {action}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {matrix.map(({ module, resources }) => (
                    <ModuleRows
                      key={module}
                      module={module}
                      resources={resources}
                      selectedPermissionIds={selectedPermissionIds}
                      canEdit={canEditMatrix}
                      canEditPermissions={canEditPermissions}
                      canDeletePermissions={canDeletePermissions}
                      isSaving={isSaving}
                      onToggleCell={onToggleCell}
                      onEditPermission={onEditPermission}
                      onDeletePermission={onDeletePermission}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      <aside className="space-y-4">
        <section className="rounded-2xl border border-slate-800 bg-[#0b1711] p-5">
          <h2 className="flex items-center gap-2 font-bold">
            <Icon name="shield" className="h-4 w-4 text-lime-300" />
            Resumen del rol
          </h2>
          <dl className="mt-5 space-y-3 text-sm">
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Nombre del rol:</dt>
              <dd className="font-semibold">{selectedRole?.name ?? "—"}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="text-slate-400">Estado:</dt>
              <dd className="inline-flex items-center gap-1.5 rounded-full bg-lime-400/10 px-2.5 py-1 text-xs font-semibold text-lime-300">
                <span className="h-1.5 w-1.5 rounded-full bg-lime-400" />
                Activo
              </dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-2 text-slate-400">
                <Icon name="user" className="h-3.5 w-3.5" />
                Usuarios asociados:
              </dt>
              <dd className="font-semibold">{assignedUsers}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-2 text-slate-400">
                <Icon name="key" className="h-3.5 w-3.5" />
                Total permisos asignados:
              </dt>
              <dd className="font-semibold">{summary.assignedCount}</dd>
            </div>
            <div className="flex items-center justify-between gap-3">
              <dt className="inline-flex items-center gap-2 text-slate-400">
                <Icon name="modules" className="h-3.5 w-3.5" />
                Módulos con acceso:
              </dt>
              <dd className="font-semibold">{summary.modulesWithAccess}</dd>
            </div>
          </dl>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            <SummaryStat
              icon="cube"
              label="Total permisos disponibles"
              value={summary.availableCount}
              tone="neutral"
            />
            <SummaryStat
              icon="check"
              label="Asignados"
              value={summary.assignedCount}
              tone="success"
            />
            <SummaryStat
              icon="close"
              label="No asignados"
              value={summary.unassignedCount}
              tone="danger"
            />
          </div>
          {isDirty && (
            <p className="mt-4 inline-flex items-center gap-2 text-xs text-amber-300">
              <Icon name="warning" className="h-3.5 w-3.5 shrink-0" />
              Hay {pendingChanges} cambio(s) pendiente(s) de guardar.
            </p>
          )}
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0b1711] p-5">
          <h3 className="font-bold">Leyenda</h3>
          <ul className="mt-3 space-y-2 text-sm text-slate-300">
            <li className="flex items-center gap-2">
              <span className="flex h-5 w-5 items-center justify-center rounded border border-lime-400/70 bg-lime-400 text-[#102016]">
                <Icon name="check" className="h-3.5 w-3.5" />
              </span>
              Permiso asignado
            </li>
            <li className="flex items-center gap-2">
              <span className="h-5 w-5 rounded border border-slate-600" />
              Permiso no asignado
            </li>
          </ul>
        </section>

        <section className="rounded-2xl border border-slate-800 bg-[#0b1711] p-5">
          <h3 className="flex items-center gap-2 font-bold">
            <Icon name="scale" className="h-4 w-4 text-lime-300" />
            Reglas de acceso
          </h3>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-300">
            <li>
              Si al menos uno de los roles del usuario posee el permiso, la
              operación se permite.
            </li>
            <li>
              Si ninguno de sus roles posee el permiso requerido, el acceso se
              deniega.
            </li>
            <li>
              Los cambios aplican a todos los usuarios que tengan asignado este
              rol.
            </li>
          </ul>
          <p className="mt-4 inline-flex items-start gap-2 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-3 text-sm text-red-200">
            <Icon name="warning" className="mt-0.5 h-4 w-4 shrink-0" />
            Retirar un permiso del rol no elimina el permiso del sistema.
          </p>
        </section>
      </aside>
    </section>
  );
};

const SummaryStat = ({
  icon,
  label,
  value,
  tone,
}: {
  icon: "cube" | "check" | "close";
  label: string;
  value: number;
  tone: "neutral" | "success" | "danger";
}) => {
  const toneClass =
    tone === "success"
      ? "border-lime-400/30 text-lime-300"
      : tone === "danger"
        ? "border-red-400/30 text-red-300"
        : "border-slate-700 text-slate-200";

  return (
    <div className={`rounded-xl border bg-[#07110d] px-2 py-3 ${toneClass}`}>
      <Icon name={icon} className="mx-auto h-4 w-4" />
      <p className="mt-1 text-xl font-black">{value}</p>
      <p className="mt-1 text-[10px] font-semibold uppercase leading-4 tracking-wide text-slate-400">
        {label}
      </p>
    </div>
  );
};

type MatrixResource = ReturnType<typeof buildPermissionMatrix>[number]["resources"][number];

const ModuleRows = ({
  module,
  resources,
  selectedPermissionIds,
  canEdit,
  canEditPermissions,
  canDeletePermissions,
  isSaving,
  onToggleCell,
  onEditPermission,
  onDeletePermission,
}: {
  module: string;
  resources: MatrixResource[];
  selectedPermissionIds: number[];
  canEdit: boolean;
  canEditPermissions: boolean;
  canDeletePermissions: boolean;
  isSaving: boolean;
  onToggleCell: (permissionIds: number[]) => void;
  onEditPermission: (permission?: Permission) => void;
  onDeletePermission: (permission?: Permission) => void;
}) => (
  <>
    <tr className="bg-[#07110d]">
      <th
        colSpan={MATRIX_ACTIONS.length + 1}
        scope="colgroup"
        className="px-5 py-3 text-left text-xs font-bold uppercase tracking-[0.18em] text-lime-300 sm:px-6"
      >
        {module}
      </th>
    </tr>
    {resources.map((resource) => (
      <tr key={resource.key} className="border-t border-slate-800">
        <th
          scope="row"
          className="px-5 py-3.5 font-medium text-slate-100 sm:px-6"
        >
          <span className="inline-flex items-center gap-2">
            <Icon
              name={iconForResource(resource.key)}
              className="h-4 w-4 text-lime-300"
            />
            {resource.label}
          </span>
        </th>
        {MATRIX_ACTIONS.map((action) => {
          const cellPermissions = resource.cells[action];
          const cellIds = cellPermissions.map((permission) => permission.id);
          return (
            <td key={action} className="px-3 py-3.5 text-center">
              <div className="flex flex-col items-center gap-1">
                <MatrixCheck
                  checked={isMatrixCellChecked(selectedPermissionIds, cellIds)}
                  disabled={!canEdit || isSaving}
                  unavailable={cellIds.length === 0}
                  onToggle={() => onToggleCell(cellIds)}
                  label={`${action} ${resource.label}`}
                />
                {(canEditPermissions || canDeletePermissions) &&
                  cellPermissions[0] && (
                    <div className="flex items-center gap-1">
                      {canEditPermissions && (
                        <button
                          type="button"
                          onClick={() => onEditPermission(cellPermissions[0])}
                          title={`Editar permiso ${action} de ${resource.label}`}
                          className="text-slate-500 transition hover:text-lime-300"
                        >
                          <Icon name="pencil" className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            Editar permiso {action} de {resource.label}
                          </span>
                        </button>
                      )}
                      {canDeletePermissions && (
                        <button
                          type="button"
                          onClick={() => onDeletePermission(cellPermissions[0])}
                          title={`Eliminar permiso ${action} de ${resource.label}`}
                          className="text-slate-500 transition hover:text-red-300"
                        >
                          <Icon name="trash" className="h-3.5 w-3.5" />
                          <span className="sr-only">
                            Eliminar permiso {action} de {resource.label}
                          </span>
                        </button>
                      )}
                    </div>
                  )}
              </div>
            </td>
          );
        })}
      </tr>
    ))}
  </>
);

export default RolePermissionMatrix;

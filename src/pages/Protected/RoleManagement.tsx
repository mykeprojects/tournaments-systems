import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Navigate } from "react-router-dom";
import { primaryButtonClass } from "../../sports/format";
import { ShieldIcon } from "../../sports/glyphs";
import { PageHeader } from "../../sports/ui";
import CreatePermissionForm from "../../components/admin/CreatePermissionForm";
import DeletePermissionForm from "../../components/admin/DeletePermissionForm";
import EditPermissionForm from "../../components/admin/EditPermissionForm";
import RolePermissionMatrix from "../../components/admin/RolePermissionMatrix";
import Icon from "../../components/icons/Icon";
import {
  arePermissionIdSetsEqual,
  assignedPermissionIdsForRole,
  toggleMatrixCell,
} from "../../domain/authorization/permissionMatrix";
import {
  DUPLICATE_ROLE_PERMISSION_MESSAGE,
  groupPermissionsByModule,
  hasDuplicateRolePermissionSet,
} from "../../domain/authorization/rolePermissions";
import { isAdministratorRole } from "../../domain/authorization/roleAccess";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";
import {
  createRole,
  deleteRole,
  listPermissions,
  listRolePermissionAssignments,
  replaceRolePermissions,
  updateRole,
} from "../../services/roleService";
import {
  getUserServiceErrorMessage,
  listRoles,
  listUserRoleAssignments,
} from "../../services/userService";
import type {
  Permission,
  RolePermissionAssignment,
} from "../../models/authorization";
import type { Role, UserRoleAssignment } from "../../models/user";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-[#245078] bg-[#071321] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-[#3dff7a] focus:ring-2 focus:ring-[#3dff7a]/20";

interface RoleFormValues {
  name: string;
  description: string;
  permissionIds: number[];
}

interface RoleData {
  roles: Role[];
  permissions: Permission[];
  rolePermissions: RolePermissionAssignment[];
  userRoles: UserRoleAssignment[];
}

const emptyRoleData: RoleData = {
  roles: [],
  permissions: [],
  rolePermissions: [],
  userRoles: [],
};

interface RoleFormModalProps {
  role: Role | null;
  permissions: Permission[];
  assignments: RolePermissionAssignment[];
  canEditRole: boolean;
  canAssignPermissions: boolean;
  canViewPermissions: boolean;
  onClose: () => void;
  onSave: (values: RoleFormValues) => Promise<void>;
}

const RoleFormModal = ({
  role,
  permissions,
  assignments,
  canEditRole,
  canAssignPermissions,
  canViewPermissions,
  onClose,
  onSave,
}: RoleFormModalProps) => {
  const [name, setName] = useState(role?.name ?? "");
  const [description, setDescription] = useState(role?.description ?? "");
  const [selectedPermissionIds, setSelectedPermissionIds] = useState<number[]>(
    () =>
      role
        ? assignments
            .filter((assignment) => assignment.roleId === role.id)
            .map((assignment) => assignment.permissionId)
        : []
  );
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDuplicateWarningOpen, setIsDuplicateWarningOpen] = useState(false);
  const isAdministrator = isAdministratorRole(role);
  const canModifySelectedPermissions =
    canAssignPermissions && !isAdministrator;
  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const togglePermission = (permissionId: number) => {
    if (!canModifySelectedPermissions) return;
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  };

  const toggleModule = (permissionIds: number[]) => {
    if (!canModifySelectedPermissions) return;
    setSelectedPermissionIds((current) => {
      const selectedAll = permissionIds.every((id) => current.includes(id));
      if (selectedAll) {
        return current.filter((id) => !permissionIds.includes(id));
      }
      return [...new Set([...current, ...permissionIds])];
    });
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsDuplicateWarningOpen(false);
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        permissionIds: selectedPermissionIds,
      });
    } catch (saveError) {
      const message = getUserServiceErrorMessage(
        saveError,
        "No fue posible guardar el rol y sus permisos."
      );
      if (message.toLocaleLowerCase().includes(
        "misma configuración de permisos"
      )) {
        setIsDuplicateWarningOpen(true);
      } else {
        setError(message);
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-40 flex items-center justify-center bg-black/75 px-4 py-6 backdrop-blur-sm"
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        aria-labelledby="role-form-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-[#245078] bg-[#071321] text-white shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-[#1b3f63] px-6 py-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-[#3dff7a]">
            Administración
          </p>
          <h2 id="role-form-title" className="mt-2 text-2xl font-black">
            {role ? "Editar rol" : "Crear rol"}
          </h2>
        </div>

        <form onSubmit={(event) => void handleSubmit(event)} className="flex min-h-0 flex-1 flex-col">
          <div className="space-y-5 overflow-y-auto px-6 py-6 sm:px-8">
            {error && (
              <p role="alert" className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {error}
              </p>
            )}
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="role-name" className="text-sm font-semibold text-slate-200">
                  Nombre del rol
                </label>
                <input
                  id="role-name"
                  autoComplete="off"
                  required
                  minLength={1}
                  maxLength={50}
                  disabled={!canEditRole || isAdministrator}
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Ej. ORGANIZADOR"
                />
              </div>
              <div>
                <label htmlFor="role-description" className="text-sm font-semibold text-slate-200">
                  Descripción
                </label>
                <input
                  id="role-description"
                  required
                  maxLength={255}
                  disabled={!canEditRole}
                  value={description}
                  onChange={(event) => setDescription(event.target.value)}
                  className={INPUT_CLASS}
                  placeholder="Finalidad del rol"
                />
              </div>
            </div>

            <section aria-labelledby="permissions-heading">
              <div className="flex flex-wrap items-end justify-between gap-2">
                <div>
                  <h3 id="permissions-heading" className="font-bold">Permisos</h3>
                  <p className="mt-1 text-xs text-slate-400">
                    Selecciona los endpoints que podrá utilizar este rol.
                  </p>
                  {isAdministrator && (
                    <p className="mt-2 text-xs font-medium text-amber-300">
                      El rol administrador conserva todos los permisos y solo se muestran en modo de consulta.
                    </p>
                  )}
                </div>
                <span className="text-xs text-slate-400">
                  {selectedPermissionIds.length} de {permissions.length} seleccionados
                </span>
              </div>

              {!canViewPermissions ? (
                <p className="mt-4 rounded-xl border border-[#1b3f63] px-4 py-5 text-sm text-slate-400">
                  No tienes permiso para consultar el catálogo de permisos.
                </p>
              ) : permissions.length === 0 ? (
                <p className="mt-4 rounded-xl border border-[#1b3f63] px-4 py-5 text-sm text-slate-400">
                  No hay permisos disponibles en el sistema.
                </p>
              ) : (
                <div className="mt-4 space-y-3">
                  {groupedPermissions.map(({ module, permissions: modulePermissions }) => {
                    const modulePermissionIds = modulePermissions.map(({ id }) => id);
                    const selectedCount = modulePermissionIds.filter((id) =>
                      selectedPermissionIds.includes(id)
                    ).length;
                    return (
                      <fieldset
                        key={module}
                        className="rounded-xl border border-[#1b3f63] bg-[#050b14]/60"
                      >
                        <legend className="sr-only">{module}</legend>
                        <div className="flex items-center justify-between gap-3 border-b border-[#1b3f63] px-4 py-3">
                          <h4 className="font-semibold text-slate-100">{module}</h4>
                          <button
                            type="button"
                            onClick={() => toggleModule(modulePermissionIds)}
                            disabled={!canModifySelectedPermissions}
                            className="text-xs font-semibold text-[#3dff7a] hover:text-[#d7ffe6]"
                          >
                            {selectedCount === modulePermissionIds.length
                              ? "Quitar módulo"
                              : "Seleccionar módulo"}
                          </button>
                        </div>
                        <div className="grid gap-1 p-3 sm:grid-cols-2">
                          {modulePermissions.map((permission) => (
                            <label
                              key={permission.id}
                              className="flex cursor-pointer items-start gap-3 rounded-lg px-2 py-2.5 transition hover:bg-white/[0.03]"
                            >
                              <input
                                type="checkbox"
                                checked={selectedPermissionIds.includes(permission.id)}
                                onChange={() => togglePermission(permission.id)}
                                disabled={!canModifySelectedPermissions}
                                className="mt-1 accent-[#3dff7a]"
                              />
                              <span className="min-w-0">
                                <span className="mr-2 inline-flex rounded bg-[#3dff7a]/10 px-1.5 py-0.5 text-[10px] font-bold text-[#3dff7a]">
                                  {permission.method}
                                </span>
                                <span className="break-all font-mono text-xs text-slate-200">
                                  {permission.url}
                                </span>
                              </span>
                            </label>
                          ))}
                        </div>
                      </fieldset>
                    );
                  })}
                </div>
              )}
            </section>
          </div>

          <div className="flex justify-end gap-3 border-t border-[#1b3f63] px-6 py-4 sm:px-8">
            <button
              type="button"
              onClick={onClose}
              disabled={isSaving}
              className="rounded-xl border border-[#245078] px-5 py-3 text-sm font-semibold text-slate-300 transition hover:border-slate-500 disabled:opacity-50"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isSaving || (!canEditRole && !canAssignPermissions)}
              className="rounded-xl bg-[#3dff7a] px-5 py-3 text-sm font-extrabold text-[#04210f] transition hover:bg-[#62ff96] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar rol"}
            </button>
          </div>
        </form>
        {isDuplicateWarningOpen && (
          <div
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 px-4 py-6 backdrop-blur-sm"
          >
            <section
              aria-labelledby="duplicate-role-warning-title"
              aria-modal="true"
              className="w-full max-w-lg rounded-2xl border border-amber-400/40 bg-[#071321] p-6 text-white shadow-2xl sm:p-8"
              role="alertdialog"
            >
              <p className="text-xs font-bold uppercase tracking-[0.22em] text-amber-300">
                Operación no permitida
              </p>
              <h2
                id="duplicate-role-warning-title"
                className="mt-2 text-xl font-black"
              >
                Combinación de permisos duplicada
              </h2>
              <p className="mt-3 text-sm leading-6 text-slate-300">
                {DUPLICATE_ROLE_PERMISSION_MESSAGE} Cambia la selección de permisos
                para que cada rol tenga una configuración diferente.
              </p>
              <div className="mt-6 flex justify-end">
                <button
                  type="button"
                  autoFocus
                  onClick={() => setIsDuplicateWarningOpen(false)}
                  className="rounded-xl bg-[#3dff7a] px-5 py-3 text-sm font-extrabold text-[#04210f] transition hover:bg-[#62ff96]"
                >
                  Entendido
                </button>
              </div>
            </section>
          </div>
        )}
      </section>
    </div>
  );
};

const RoleManagement = () => {
  const {
    hasPermission,
    permissionCheckError,
    refreshPermissions,
  } = useAuth();
  const canViewRoles = hasPermission("roles.view");
  const canCreateRoles = hasPermission("roles.create");
  const canEditRoles = hasPermission("roles.edit");
  const canDeleteRoles = hasPermission("roles.delete");
  const canViewPermissions = hasPermission("permissions.view");
  const canCreatePermissions = hasPermission("permissions.create");
  const canEditPermissions = hasPermission("permissions.edit");
  const canDeletePermissions = hasPermission("permissions.delete");
  const canAssignPermissions = hasPermission("permissions.assign");
  const canViewUserRoleAssignments = hasPermission("users.assignRoles");
  const [roleData, setRoleData] = useState<RoleData>(emptyRoleData);
  const [isLoading, setIsLoading] = useState(canViewRoles);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [draftPermissionIds, setDraftPermissionIds] = useState<number[]>([]);
  const [isSavingMatrix, setIsSavingMatrix] = useState(false);
  const [isCreatePermissionOpen, setIsCreatePermissionOpen] = useState(false);
  const [isEditPermissionOpen, setIsEditPermissionOpen] = useState(false);
  const [isDeletePermissionOpen, setIsDeletePermissionOpen] = useState(false);
  const [permissionBeingEdited, setPermissionBeingEdited] =
    useState<Permission | null>(null);
  const [matrixSuccess, setMatrixSuccess] = useState<string | null>(null);
  const [matrixError, setMatrixError] = useState<string | null>(null);

  const loadRoleData = useCallback(async (): Promise<RoleData> => {
    const [roles, permissions, rolePermissions, userRoles] = await Promise.all([
      listRoles(),
      canViewPermissions ? listPermissions() : Promise.resolve([]),
      canAssignPermissions
        ? listRolePermissionAssignments()
        : Promise.resolve([]),
      canViewUserRoleAssignments
        ? listUserRoleAssignments()
        : Promise.resolve([]),
    ]);
    return { roles, permissions, rolePermissions, userRoles };
  }, [
    canAssignPermissions,
    canViewPermissions,
    canViewUserRoleAssignments,
  ]);

  const refreshData = useCallback(async (): Promise<RoleData | null> => {
    try {
      const data = await loadRoleData();
      setRoleData(data);
      setLoadError(null);
      return data;
    } catch (error) {
      setLoadError(
        getUserServiceErrorMessage(error, "No fue posible cargar roles y permisos.")
      );
      return null;
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [loadRoleData]);

  useEffect(() => {
    if (!canViewRoles) {
      return;
    }

    let active = true;
    const loadData = async () => {
      try {
        const data = await loadRoleData();
        if (active) {
          setRoleData(data);
          setLoadError(null);
        }
      } catch (error) {
        if (active) {
          setLoadError(
            getUserServiceErrorMessage(error, "No fue posible cargar roles y permisos.")
          );
        }
      } finally {
        if (active) {
          setIsLoading(false);
          setIsRefreshing(false);
        }
      }
    };

    void loadData();
    return () => {
      active = false;
    };
  }, [canViewRoles, loadRoleData]);

  const assignedUsersByRole = useMemo(() => {
    const counts = new Map<number, number>();
    for (const assignment of roleData.userRoles) {
      counts.set(assignment.role.id, (counts.get(assignment.role.id) ?? 0) + 1);
    }
    return counts;
  }, [roleData.userRoles]);

  const persistedPermissionIds = useMemo(
    () =>
      selectedRoleId === null
        ? []
        : assignedPermissionIdsForRole(selectedRoleId, roleData.rolePermissions),
    [roleData.rolePermissions, selectedRoleId]
  );
  const isMatrixDirty = !arePermissionIdSetsEqual(
    draftPermissionIds,
    persistedPermissionIds
  );

  useEffect(() => {
    if (roleData.roles.length === 0) {
      setSelectedRoleId(null);
      setDraftPermissionIds([]);
      return;
    }
    const selectedStillExists = roleData.roles.some(
      (role) => role.id === selectedRoleId
    );
    if (!selectedStillExists) {
      const nextRoleId = roleData.roles[0].id;
      setSelectedRoleId(nextRoleId);
      setDraftPermissionIds(
        assignedPermissionIdsForRole(nextRoleId, roleData.rolePermissions)
      );
    }
  }, [roleData.rolePermissions, roleData.roles, selectedRoleId]);

  const rolePermissionCounts = useMemo(() => {
    const counts = new Map<number, number>();
    for (const assignment of roleData.rolePermissions) {
      counts.set(assignment.roleId, (counts.get(assignment.roleId) ?? 0) + 1);
    }
    return counts;
  }, [roleData.rolePermissions]);

  const handleSaveRole = async (values: RoleFormValues) => {
    const duplicate = roleData.roles.some(
      (role) =>
        role.name.trim().toLocaleLowerCase() ===
          values.name.toLocaleLowerCase() &&
        role.id !== editingRole?.id
    );
    if (duplicate) {
      throw new Error("Ya existe un rol con ese nombre.");
    }

    if (!editingRole && !canCreateRoles) {
      throw new Error("No tienes permiso para crear roles.");
    }

    if (editingRole && !canEditRoles && !canAssignPermissions) {
      throw new Error("No tienes permiso para modificar este rol.");
    }

    const isEditingAdministrator = isAdministratorRole(editingRole);
    const canSavePermissionSet =
      canAssignPermissions && canViewPermissions && !isEditingAdministrator;
    const permissionIds = [...new Set(values.permissionIds)];
    if (
      (!editingRole || canSavePermissionSet) &&
      hasDuplicateRolePermissionSet(
        roleData.roles.map(({ id }) => id),
        roleData.rolePermissions,
        permissionIds,
        editingRole?.id
      )
    ) {
      throw new Error(DUPLICATE_ROLE_PERMISSION_MESSAGE);
    }

    if (!editingRole) {
      await createRole({
        name: values.name,
        description: values.description,
        ...(canSavePermissionSet ? { permissionIds } : {}),
      });
    } else if (canEditRoles) {
      await updateRole(editingRole.id, {
          name: values.name,
          description: values.description,
          ...(canSavePermissionSet ? { permissionIds } : {}),
      });
    } else if (canSavePermissionSet) {
      await replaceRolePermissions(editingRole.id, permissionIds);
    }

    setIsCreatingRole(false);
    setEditingRole(null);
    setPageError(null);
    setSuccessMessage(
      editingRole ? "El rol se actualizó correctamente." : "El rol se creó correctamente."
    );
    setIsRefreshing(true);
    await refreshData();
  };

  const handleDeleteRole = async (role: Role) => {
    const assignedUsers = assignedUsersByRole.get(role.id) ?? 0;
    if (assignedUsers > 0) {
      setPageError(
        `No se puede eliminar "${role.name}" porque está asignado a ${assignedUsers} usuario(s).`
      );
      return;
    }
    if (!window.confirm(`¿Seguro que deseas eliminar el rol "${role.name}"?`)) {
      return;
    }

    setDeletingRoleId(role.id);
    setPageError(null);
    setSuccessMessage(null);
    try {
      await deleteRole(role.id);
      setSuccessMessage(`El rol "${role.name}" se eliminó correctamente.`);
      setIsRefreshing(true);
      await refreshData();
    } catch (error) {
      setPageError(
        getUserServiceErrorMessage(error, "No fue posible eliminar el rol.")
      );
    } finally {
      setDeletingRoleId(null);
    }
  };

  const handleSelectMatrixRole = (roleId: number): boolean => {
    if (roleId === selectedRoleId) {
      return true;
    }
    if (
      isMatrixDirty &&
      !window.confirm("Hay cambios sin guardar en la matriz. ¿Descartarlos?")
    ) {
      return false;
    }
    setMatrixError(null);
    setMatrixSuccess(null);
    setSelectedRoleId(roleId);
    setDraftPermissionIds(
      assignedPermissionIdsForRole(roleId, roleData.rolePermissions)
    );
    return true;
  };

  const handleSaveMatrix = async () => {
    if (selectedRoleId === null) {
      return;
    }
    const selectedRole = roleData.roles.find((role) => role.id === selectedRoleId);
    if (!selectedRole) {
      return;
    }
    if (isAdministratorRole(selectedRole)) {
      setMatrixError("El rol administrador no permite cambiar sus permisos.");
      return;
    }
    if (!canAssignPermissions) {
      setMatrixError("No tienes permiso para asignar permisos a roles.");
      return;
    }

    const permissionIds = [...new Set(draftPermissionIds)];
    if (
      hasDuplicateRolePermissionSet(
        roleData.roles.map(({ id }) => id),
        roleData.rolePermissions,
        permissionIds,
        selectedRoleId
      )
    ) {
      setMatrixError(DUPLICATE_ROLE_PERMISSION_MESSAGE);
      return;
    }

    setIsSavingMatrix(true);
    setMatrixError(null);
    setMatrixSuccess(null);
    try {
      await replaceRolePermissions(selectedRoleId, permissionIds);
      setMatrixSuccess("Permisos actualizados correctamente.");
      setIsRefreshing(true);
      await refreshData();
    } catch (error) {
      setMatrixError(
        getUserServiceErrorMessage(
          error,
          "No fue posible guardar los permisos del rol."
        )
      );
    } finally {
      setIsSavingMatrix(false);
    }
  };

  if (permissionCheckError) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <section className="max-w-lg rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
          <p role="alert" className="text-sm text-red-300">
            No fue posible consultar tus permisos: {permissionCheckError}
          </p>
          <button
            type="button"
            onClick={() => void refreshPermissions()}
            className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200"
          >
            Reintentar
          </button>
        </section>
      </div>
    );
  }

  if (!canViewRoles) return <Navigate to={routePaths.dashboard} replace />;

  return (
    <div>
      <PageHeader
        icon={<ShieldIcon />}
        title="Asignar permisos a roles"
        subtitle="Administra de manera centralizada los permisos que puede ejecutar cada rol del sistema."
        actions={
          <button
            type="button"
            onClick={() => {
              setEditingRole(null);
              setPageError(null);
              setSuccessMessage(null);
              setIsCreatingRole(true);
            }}
            className={primaryButtonClass}
          >
            <Icon name="plus" className="h-4 w-4" />
            Crear rol
          </button>
        }
      />

        {successMessage && (
          <p role="status" className="mt-6 rounded-xl border border-[#3dff7a]/20 bg-[#3dff7a]/10 px-4 py-3 text-sm text-[#d7ffe6]">
            {successMessage}
          </p>
        )}
        {pageError && (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {pageError}
          </p>
        )}

        {(canViewPermissions || canAssignPermissions) && (
          <RolePermissionMatrix
            roles={roleData.roles}
            permissions={roleData.permissions}
            assignments={roleData.rolePermissions}
            selectedRoleId={selectedRoleId}
            selectedPermissionIds={draftPermissionIds}
            assignedUsers={
              selectedRoleId === null
                ? 0
                : assignedUsersByRole.get(selectedRoleId) ?? 0
            }
            isLoading={isLoading}
            isRefreshing={isRefreshing}
            isSaving={isSavingMatrix}
            isDirty={isMatrixDirty}
            canAssign={canAssignPermissions}
            canCreatePermissions={canCreatePermissions}
            canEditPermissions={canEditPermissions}
            canDeletePermissions={canDeletePermissions}
            successMessage={matrixSuccess}
            errorMessage={matrixError}
            onSelectRole={handleSelectMatrixRole}
            onToggleCell={(permissionIds) => {
              if (!canAssignPermissions) {
                return;
              }
              setMatrixError(null);
              setMatrixSuccess(null);
              setDraftPermissionIds((current) =>
                toggleMatrixCell(current, permissionIds)
              );
            }}
            onLoad={() => {
              setMatrixError(null);
              setLoadError(null);
              setIsRefreshing(true);
              void refreshData().then((data) => {
                if (!data) {
                  setMatrixError("No fue posible cargar los permisos del rol.");
                  return;
                }
                const roleId =
                  selectedRoleId !== null &&
                  data.roles.some((role) => role.id === selectedRoleId)
                    ? selectedRoleId
                    : data.roles[0]?.id ?? null;
                setSelectedRoleId(roleId);
                setDraftPermissionIds(
                  roleId === null
                    ? []
                    : assignedPermissionIdsForRole(roleId, data.rolePermissions)
                );
                setMatrixSuccess("Permisos cargados correctamente.");
              });
            }}
            onSave={() => void handleSaveMatrix()}
            onReset={() => {
              setMatrixError(null);
              setMatrixSuccess(null);
              setDraftPermissionIds(persistedPermissionIds);
            }}
            onCreatePermission={() => {
              setMatrixError(null);
              setIsCreatePermissionOpen(true);
            }}
            onEditPermission={(permission) => {
              setMatrixError(null);
              setPermissionBeingEdited(permission ?? null);
              setIsEditPermissionOpen(true);
            }}
            onDeletePermission={(permission) => {
              setMatrixError(null);
              setPermissionBeingEdited(permission ?? null);
              setIsDeletePermissionOpen(true);
            }}
          />
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-[#1b3f63] bg-[#071321]/95 shadow-[0_12px_40px_rgba(0,0,0,0.25)]">
          <div className="flex items-center justify-between gap-4 border-b border-[#1b3f63] px-5 py-5 sm:px-7">
            <div>
              <h2 className="font-bold">Roles registrados</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading
                  ? "Cargando..."
                  : `${roleData.roles.length} roles. Usa Asignar para administrarlos en la matriz.`}
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setSuccessMessage(null);
                setLoadError(null);
                setIsRefreshing(true);
                void refreshData();
              }}
              disabled={isRefreshing}
              className="rounded-lg border border-[#245078] px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50"
            >
              {isRefreshing ? "Actualizando..." : "Actualizar"}
            </button>
          </div>

          {loadError && (
            <div className="px-6 py-5">
              <p role="alert" className="text-sm text-red-300">{loadError}</p>
              <button
                type="button"
                onClick={() => {
                  setLoadError(null);
                  setIsRefreshing(true);
                  void refreshData();
                }}
                className="mt-3 rounded-lg border border-red-400/40 px-3 py-2 text-xs font-semibold text-red-200"
              >
                Reintentar
              </button>
            </div>
          )}
          {isLoading ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Cargando roles y permisos...
            </p>
          ) : roleData.roles.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Aún no hay roles registrados.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">Nombre</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Descripción</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Permisos</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Usuarios</th>
                    <th scope="col" className="px-6 py-4 font-semibold">Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {roleData.roles.map((role) => {
                    const assignedUsers = assignedUsersByRole.get(role.id) ?? 0;
                    return (
                      <tr key={role.id} className="border-t border-white/5 transition hover:bg-white/[0.03]">
                        <td className="px-6 py-5 font-semibold text-slate-100">
                          <span className="rounded-full border border-[#3dff7a]/20 bg-[#3dff7a]/10 px-3 py-1 text-xs text-[#d7ffe6]">
                            {role.name}
                          </span>
                        </td>
                        <td className="max-w-sm px-6 py-5 text-slate-400">{role.description}</td>
                        <td className="px-6 py-5 text-slate-300">
                          {canAssignPermissions
                            ? rolePermissionCounts.get(role.id) ?? 0
                            : "—"}
                        </td>
                        <td className="px-6 py-5 text-slate-300">
                          {canViewUserRoleAssignments ? assignedUsers : "—"}
                        </td>
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-2">
                            {canEditRoles && <button
                              type="button"
                              onClick={() => {
                                setPageError(null);
                                setSuccessMessage(null);
                                setEditingRole(role);
                                setIsCreatingRole(false);
                              }}
                              className="rounded-lg border border-[#3dff7a]/30 px-3 py-2 text-xs font-semibold text-[#d7ffe6] transition hover:bg-[#3dff7a]/10"
                            >
                              Editar
                            </button>}
                            {canDeleteRoles && !isAdministratorRole(role) && <button
                              type="button"
                              onClick={() => void handleDeleteRole(role)}
                              disabled={
                                deletingRoleId === role.id ||
                                (canViewUserRoleAssignments && assignedUsers > 0)
                              }
                              title={
                                canViewUserRoleAssignments && assignedUsers > 0
                                  ? "No se puede eliminar un rol asignado a usuarios"
                                  : "Eliminar rol"
                              }
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 transition hover:bg-red-500/10 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {deletingRoleId === role.id ? "Eliminando..." : "Eliminar"}
                            </button>}
                            {canAssignPermissions && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPageError(null);
                                  setSuccessMessage(null);
                                  if (handleSelectMatrixRole(role.id)) {
                                    window.scrollTo({ top: 0, behavior: "smooth" });
                                  }
                                }}
                                className="rounded-lg border border-[#3dff7a]/30 px-3 py-2 text-xs font-semibold text-[#d7ffe6] transition hover:bg-[#3dff7a]/10"
                              >
                                Asignar
                              </button>
                            )}
                            {canAssignPermissions && !canEditRoles && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPageError(null);
                                  setSuccessMessage(null);
                                  setEditingRole(role);
                                  setIsCreatingRole(false);
                                }}
                                className="rounded-lg border border-[#3dff7a]/30 px-3 py-2 text-xs font-semibold text-[#d7ffe6] transition hover:bg-[#3dff7a]/10"
                              >
                                Permisos
                              </button>
                            )}
                          </div>
                          {assignedUsers > 0 && (
                            <p className="mt-2 text-xs text-slate-500">
                              Asignado a usuarios; no se puede eliminar.
                            </p>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </section>

      {isCreatePermissionOpen && (
        <CreatePermissionForm
          onClose={() => setIsCreatePermissionOpen(false)}
          onCreated={async (summary) => {
            setMatrixSuccess(summary);
            setIsRefreshing(true);
            const data = await refreshData();
            if (!data || selectedRoleId === null) {
              return;
            }
            const selectedRole = data.roles.find(
              (role) => role.id === selectedRoleId
            );
            if (selectedRole && isAdministratorRole(selectedRole)) {
              setDraftPermissionIds(
                assignedPermissionIdsForRole(
                  selectedRoleId,
                  data.rolePermissions
                )
              );
            }
          }}
        />
      )}

      {isEditPermissionOpen && (
        <EditPermissionForm
          permissions={roleData.permissions}
          initialPermission={permissionBeingEdited}
          canDelete={canDeletePermissions}
          onClose={() => {
            setIsEditPermissionOpen(false);
            setPermissionBeingEdited(null);
          }}
          onUpdated={async (summary) => {
            setMatrixSuccess(summary);
            setIsRefreshing(true);
            const data = await refreshData();
            if (!data || selectedRoleId === null) {
              return;
            }
            setDraftPermissionIds(
              assignedPermissionIdsForRole(selectedRoleId, data.rolePermissions)
            );
          }}
        />
      )}

      {isDeletePermissionOpen && (
        <DeletePermissionForm
          permissions={roleData.permissions}
          initialPermission={permissionBeingEdited}
          onClose={() => {
            setIsDeletePermissionOpen(false);
            setPermissionBeingEdited(null);
          }}
          onDeleted={async (summary) => {
            setMatrixSuccess(summary);
            setIsRefreshing(true);
            const data = await refreshData();
            if (!data || selectedRoleId === null) {
              return;
            }
            setDraftPermissionIds(
              assignedPermissionIdsForRole(selectedRoleId, data.rolePermissions)
            );
          }}
        />
      )}

      {(isCreatingRole || editingRole) && (
        <RoleFormModal
          role={editingRole}
          permissions={roleData.permissions}
          assignments={roleData.rolePermissions}
          canEditRole={editingRole ? canEditRoles : canCreateRoles}
          canAssignPermissions={canAssignPermissions}
          canViewPermissions={canViewPermissions}
          onClose={() => {
            if (!isRefreshing) {
              setIsCreatingRole(false);
              setEditingRole(null);
            }
          }}
          onSave={handleSaveRole}
        />
      )}
    </div>
  );
};

export default RoleManagement;

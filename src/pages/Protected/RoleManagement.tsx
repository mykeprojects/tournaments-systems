import { useCallback, useEffect, useMemo, useState, type FormEvent } from "react";
import { Link, Navigate } from "react-router-dom";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";
import {
  createRole,
  deleteRole,
  groupPermissionsByModule,
  listPermissions,
  listRolePermissionAssignments,
  syncRolePermissions,
  updateRole,
  type Permission,
  type RolePermissionAssignment,
} from "../../services/roleService";
import {
  getUserServiceErrorMessage,
  listRoles,
  listUserRoleAssignments,
  type Role,
  type UserRoleAssignment,
} from "../../services/userService";

const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1711] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

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
  const groupedPermissions = useMemo(
    () => groupPermissionsByModule(permissions),
    [permissions]
  );

  const togglePermission = (permissionId: number) => {
    if (!canAssignPermissions) return;
    setSelectedPermissionIds((current) =>
      current.includes(permissionId)
        ? current.filter((id) => id !== permissionId)
        : [...current, permissionId]
    );
  };

  const toggleModule = (permissionIds: number[]) => {
    if (!canAssignPermissions) return;
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
    setIsSaving(true);
    try {
      await onSave({
        name: name.trim(),
        description: description.trim(),
        permissionIds: selectedPermissionIds,
      });
    } catch (saveError) {
      setError(
        getUserServiceErrorMessage(
          saveError,
          "No fue posible guardar el rol y sus permisos."
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
        if (event.target === event.currentTarget && !isSaving) onClose();
      }}
    >
      <section
        aria-labelledby="role-form-title"
        aria-modal="true"
        className="flex max-h-[92vh] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-slate-700 bg-[#0b1711] text-white shadow-2xl"
        role="dialog"
      >
        <div className="border-b border-slate-800 px-6 py-5 sm:px-8">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-lime-400">
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
                  disabled={!canEditRole}
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
                </div>
                <span className="text-xs text-slate-400">
                  {selectedPermissionIds.length} de {permissions.length} seleccionados
                </span>
              </div>

              {!canViewPermissions ? (
                <p className="mt-4 rounded-xl border border-slate-800 px-4 py-5 text-sm text-slate-400">
                  No tienes permiso para consultar el catálogo de permisos.
                </p>
              ) : permissions.length === 0 ? (
                <p className="mt-4 rounded-xl border border-slate-800 px-4 py-5 text-sm text-slate-400">
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
                        className="rounded-xl border border-slate-800 bg-[#07110d]/60"
                      >
                        <legend className="sr-only">{module}</legend>
                        <div className="flex items-center justify-between gap-3 border-b border-slate-800 px-4 py-3">
                          <h4 className="font-semibold text-slate-100">{module}</h4>
                          <button
                            type="button"
                            onClick={() => toggleModule(modulePermissionIds)}
                            disabled={!canAssignPermissions}
                            className="text-xs font-semibold text-lime-300 hover:text-lime-200"
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
                                disabled={!canAssignPermissions}
                                className="mt-1 accent-lime-400"
                              />
                              <span className="min-w-0">
                                <span className="mr-2 inline-flex rounded bg-lime-400/10 px-1.5 py-0.5 text-[10px] font-bold text-lime-300">
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

          <div className="flex justify-end gap-3 border-t border-slate-800 px-6 py-4 sm:px-8">
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
              disabled={isSaving || (!canEditRole && !canAssignPermissions)}
              className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSaving ? "Guardando..." : "Guardar rol"}
            </button>
          </div>
        </form>
      </section>
    </div>
  );
};

const RoleManagement = () => {
  const {
    user,
    logout,
    hasPermission,
    permissionCheckError,
    refreshPermissions,
  } = useAuth();
  const canViewRoles = hasPermission("roles.view");
  const canCreateRoles = hasPermission("roles.create");
  const canEditRoles = hasPermission("roles.edit");
  const canDeleteRoles = hasPermission("roles.delete");
  const canViewPermissions = hasPermission("permissions.view");
  const canAssignPermissions = hasPermission("permissions.assign");
  const canViewUserRoleAssignments = hasPermission("users.assignRoles");
  const [roleData, setRoleData] = useState<RoleData>(emptyRoleData);
  const [isLoading, setIsLoading] = useState(canViewRoles);
  const [isRefreshing, setIsRefreshing] = useState(canViewRoles);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [pageError, setPageError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [editingRole, setEditingRole] = useState<Role | null>(null);
  const [isCreatingRole, setIsCreatingRole] = useState(false);
  const [deletingRoleId, setDeletingRoleId] = useState<number | null>(null);

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

  const refreshData = useCallback(async () => {
    try {
      setRoleData(await loadRoleData());
    } catch (error) {
      setLoadError(
        getUserServiceErrorMessage(error, "No fue posible cargar roles y permisos.")
      );
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

    const savedRole = editingRole
      ? canEditRoles
        ? await updateRole(editingRole.id, {
          name: values.name,
          description: values.description,
          })
        : editingRole
      : await createRole({
          name: values.name,
          description: values.description,
        });

    try {
      if (canAssignPermissions && canViewPermissions) {
        await syncRolePermissions(
          savedRole.id,
          values.permissionIds,
          roleData.rolePermissions
        );
      }
    } catch (error) {
      setPageError(
        getUserServiceErrorMessage(
          error,
          "El rol se guardó, pero no fue posible sincronizar todos sus permisos."
        )
      );
      setIsRefreshing(true);
      await refreshData();
      throw error;
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

  const handleLogout = () => void logout();

  if (permissionCheckError) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-[#07110d] px-5 text-white">
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
      </main>
    );
  }

  if (!canViewRoles) return <Navigate to={routePaths.dashboard} replace />;

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <header className="border-b border-slate-800 bg-[#0a1510]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <Link to={routePaths.dashboard} className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lg font-black text-[#102016]">
              +
            </span>
            <span>
              <span className="block font-black tracking-tight">
                Sports System<span className="text-lime-400">+</span>
              </span>
              <span className="block text-xs text-slate-500">Administración</span>
            </span>
          </Link>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:inline">{user?.email}</span>
            {canCreateRoles && <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400/50 hover:text-red-300"
            >
              Cerrar sesión
            </button>}
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <Link
          to={routePaths.dashboard}
          className="text-sm font-semibold text-lime-300 transition hover:text-lime-200"
        >
          ← Volver a usuarios
        </Link>
        <div className="mt-7 flex flex-col justify-between gap-5 sm:flex-row sm:items-end">
          <div>
            <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-lime-400">
              Panel de control
            </p>
            <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
              Gestión de roles
            </h1>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
              Crea roles y administra los permisos que controlan el acceso a cada módulo.
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              setEditingRole(null);
              setPageError(null);
              setSuccessMessage(null);
              setIsCreatingRole(true);
            }}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300 disabled:cursor-not-allowed disabled:opacity-50"
          >
            <span aria-hidden="true" className="text-lg leading-none">+</span>
            Crear rol
          </button>
        </div>

        {successMessage && (
          <p role="status" className="mt-6 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
            {successMessage}
          </p>
        )}
        {pageError && (
          <p role="alert" className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
            {pageError}
          </p>
        )}

        <section className="mt-8 overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1711]">
          <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-7">
            <div>
              <h2 className="font-bold">Roles registrados</h2>
              <p className="mt-1 text-sm text-slate-500">
                {isLoading ? "Cargando..." : `${roleData.roles.length} roles`}
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
              className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50"
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
                <tbody className="divide-y divide-slate-800">
                  {roleData.roles.map((role) => {
                    const assignedUsers = assignedUsersByRole.get(role.id) ?? 0;
                    return (
                      <tr key={role.id} className="transition hover:bg-white/[0.02]">
                        <td className="px-6 py-5 font-semibold text-slate-100">
                          <span className="rounded-full border border-lime-400/20 bg-lime-400/10 px-3 py-1 text-xs text-lime-200">
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
                              className="rounded-lg border border-lime-400/30 px-3 py-2 text-xs font-semibold text-lime-200 transition hover:bg-lime-400/10"
                            >
                              Editar
                            </button>}
                            {canDeleteRoles && <button
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
                            {canAssignPermissions && !canEditRoles && (
                              <button
                                type="button"
                                onClick={() => {
                                  setPageError(null);
                                  setSuccessMessage(null);
                                  setEditingRole(role);
                                  setIsCreatingRole(false);
                                }}
                                className="rounded-lg border border-lime-400/30 px-3 py-2 text-xs font-semibold text-lime-200 transition hover:bg-lime-400/10"
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
      </div>

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
    </main>
  );
};

export default RoleManagement;

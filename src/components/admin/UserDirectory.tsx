import type { FormEvent, ReactNode } from "react";
import { isAdministratorRole } from "../../services/roleService";
import ProfileFieldsForm, {
  type ProfileFormValues,
} from "../profile/ProfileFieldsForm";
import UserAuthorizationPanel from "../profile/UserAuthorizationPanel";
import type {
  Role,
  UserDetail,
  UserRoleAssignment,
  UserSummary,
} from "../../services/userService";
import {
  isAdministratorRoleAssignmentRemovalProtected,
  ADMINISTRATOR_ROLE_ASSIGNMENT_PROTECTED_MESSAGE,
} from "../../services/userService";

type UserDirectoryProps = {
  users: UserSummary[];
  roles: Role[];
  userRoleAssignments: UserRoleAssignment[];
  selectedRoleByUser: Record<number, string>;
  isLoadingUsers: boolean;
  isLoadingRoleData: boolean;
  listError: string | null;
  currentUserId?: number;
  updatingUserId: number | null;
  assigningRoleUserId: number | null;
  removingRoleAssignmentId: number | null;
  viewingUserId: number | null;
  viewedUser: UserDetail | null;
  profileViewError: string | null;
  canAssignRoles: boolean;
  canViewUserDetails: boolean;
  canDeleteUsers: boolean;
  canEditViewedProfile: boolean;
  isEditingViewedProfile: boolean;
  viewedProfileForm: ProfileFormValues;
  viewedProfileError: string | null;
  isSavingViewedProfile: boolean;
  latestBirthDate: string;
  inputClassName: string;
  renderProfileDetails: (profile: UserDetail["profile"]) => ReactNode;
  onRefresh: () => void;
  onSelectRole: (userId: number, roleId: string) => void;
  onAssignRole: (user: UserSummary) => void;
  onRemoveRole: (user: UserSummary, assignment: UserRoleAssignment) => void;
  onViewProfile: (user: UserSummary) => void;
  onCloseProfile: () => void;
  onDelete: (user: UserSummary) => void;
  onStartEditViewedProfile: () => void;
  onChangeViewedProfile: (values: ProfileFormValues) => void;
  onCancelEditViewedProfile: () => void;
  onSaveViewedProfile: (event: FormEvent<HTMLFormElement>) => void;
};

const UserDirectory = ({
  users,
  roles,
  userRoleAssignments,
  selectedRoleByUser,
  isLoadingUsers,
  isLoadingRoleData,
  listError,
  currentUserId,
  updatingUserId,
  assigningRoleUserId,
  removingRoleAssignmentId,
  viewingUserId,
  viewedUser,
  profileViewError,
  canAssignRoles,
  canViewUserDetails,
  canDeleteUsers,
  canEditViewedProfile,
  isEditingViewedProfile,
  viewedProfileForm,
  viewedProfileError,
  isSavingViewedProfile,
  latestBirthDate,
  inputClassName,
  renderProfileDetails,
  onRefresh,
  onSelectRole,
  onAssignRole,
  onRemoveRole,
  onViewProfile,
  onCloseProfile,
  onDelete,
  onStartEditViewedProfile,
  onChangeViewedProfile,
  onCancelEditViewedProfile,
  onSaveViewedProfile,
}: UserDirectoryProps) => {
  const showProfile = Boolean(viewedUser || viewingUserId || profileViewError);

  return (
    <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1711]">
      <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-7">
        <div>
          <h2 className="font-bold">
            {showProfile ? "Perfil de usuario" : "Usuarios registrados"}
          </h2>
          <p className="mt-1 text-sm text-slate-500">
            {showProfile
              ? viewedUser
                ? `${viewedUser.name} · ${viewedUser.email}`
                : viewingUserId
                  ? "Cargando perfil..."
                  : "No fue posible abrir el perfil"
              : isLoadingUsers
                ? "Cargando..."
                : `${users.length} usuarios`}
          </p>
        </div>
        {showProfile ? (
          <button
            type="button"
            onClick={onCloseProfile}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 transition hover:border-slate-500 hover:text-white"
          >
            Cerrar perfil
          </button>
        ) : (
          <button
            type="button"
            onClick={onRefresh}
            disabled={isLoadingUsers}
            className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50"
          >
            Actualizar
          </button>
        )}
      </div>

      <div className="directory-stage">
        <div
          className={`directory-layer ${showProfile ? "directory-layer-inactive" : "directory-layer-active"}`}
          aria-hidden={showProfile}
          inert={showProfile || undefined}
        >
          {listError && (
            <p role="alert" className="px-6 py-4 text-sm text-red-300">
              {listError}
            </p>
          )}
          {isLoadingUsers ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Cargando usuarios...
            </p>
          ) : users.length === 0 ? (
            <p className="px-6 py-10 text-center text-sm text-slate-400">
              Aún no hay usuarios registrados.
            </p>
          ) : (
            <table className="w-full min-w-[1080px] text-left text-sm">
                <thead className="sticky top-0 z-10 bg-[#0b1711] text-xs uppercase tracking-wider text-slate-500">
                  <tr>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      ID
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Nombre
                    </th>
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Correo electrónico
                    </th>
                    {canAssignRoles && (
                      <th scope="col" className="px-6 py-4 font-semibold">
                        Roles
                      </th>
                    )}
                    <th scope="col" className="px-6 py-4 font-semibold">
                      Acciones
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {users.map((listedUser) => (
                    <tr
                      key={listedUser.id}
                      className="transition hover:bg-white/[0.02]"
                    >
                      <td className="px-6 py-4 text-slate-500">{listedUser.id}</td>
                      <td className="px-6 py-4 font-semibold text-slate-200">
                        {listedUser.name}
                      </td>
                      <td className="px-6 py-4 text-slate-400">{listedUser.email}</td>
                      {canAssignRoles && (
                        <td className="px-6 py-4">
                          <div className="mb-3 flex flex-wrap gap-2">
                            {userRoleAssignments
                              .filter(
                                (assignment) => assignment.userId === listedUser.id
                              )
                              .map((assignment) => {
                                const isOwnAdminRole =
                                  listedUser.id === currentUserId &&
                                  isAdministratorRole(assignment.role);
                                const isProtectedAdministratorRole =
                                  isAdministratorRoleAssignmentRemovalProtected(
                                    userRoleAssignments,
                                    currentUserId,
                                    listedUser.id,
                                    assignment.role
                                  );
                                const isRemoving =
                                  removingRoleAssignmentId === assignment.id;
                                return (
                                  <span
                                    key={assignment.id}
                                    className="inline-flex items-center gap-1 rounded-full border border-lime-400/20 bg-lime-400/10 py-1 pl-2.5 pr-1 text-xs text-lime-200"
                                  >
                                    {assignment.role.name}
                                    <button
                                      type="button"
                                      onClick={() =>
                                        onRemoveRole(listedUser, assignment)
                                      }
                                      disabled={
                                        isOwnAdminRole ||
                                        isProtectedAdministratorRole ||
                                        isRemoving
                                      }
                                      title={
                                        isOwnAdminRole
                                          ? "No puedes quitarte el rol ADMIN"
                                          : isProtectedAdministratorRole
                                            ? ADMINISTRATOR_ROLE_ASSIGNMENT_PROTECTED_MESSAGE
                                          : `Quitar rol ${assignment.role.name}`
                                      }
                                      aria-label={
                                        isProtectedAdministratorRole
                                          ? `${ADMINISTRATOR_ROLE_ASSIGNMENT_PROTECTED_MESSAGE} Rol de ${listedUser.name}.`
                                          : `Quitar rol ${assignment.role.name} de ${listedUser.name}`
                                      }
                                      className="flex h-5 w-5 items-center justify-center rounded-full text-lime-100 transition hover:bg-red-500/20 hover:text-red-200 disabled:cursor-not-allowed disabled:opacity-40"
                                    >
                                      {isRemoving ? "…" : "×"}
                                    </button>
                                  </span>
                                );
                              })}
                            {!isLoadingRoleData &&
                              !userRoleAssignments.some(
                                (assignment) => assignment.userId === listedUser.id
                              ) && (
                                <span className="text-xs text-slate-500">
                                  Sin roles
                                </span>
                              )}
                          </div>
                          <div className="flex items-center gap-2">
                            <select
                              aria-label={`Rol para ${listedUser.name}`}
                              value={selectedRoleByUser[listedUser.id] ?? ""}
                              onChange={(event) =>
                                onSelectRole(listedUser.id, event.target.value)
                              }
                              disabled={isLoadingRoleData || roles.length === 0}
                              className="min-w-36 rounded-lg border border-slate-700 bg-[#0b1711] px-3 py-2 text-xs text-white disabled:opacity-50"
                            >
                              <option value="">
                                {isLoadingRoleData
                                  ? "Cargando roles..."
                                  : "Asignar rol"}
                              </option>
                              {roles
                                .filter(
                                  (role) =>
                                    !userRoleAssignments.some(
                                      (assignment) =>
                                        assignment.userId === listedUser.id &&
                                        assignment.role.id === role.id
                                    )
                                )
                                .map((role) => (
                                  <option key={role.id} value={role.id}>
                                    {role.name}
                                  </option>
                                ))}
                            </select>
                            <button
                              type="button"
                              onClick={() => onAssignRole(listedUser)}
                              disabled={
                                isLoadingRoleData ||
                                assigningRoleUserId === listedUser.id ||
                                !selectedRoleByUser[listedUser.id]
                              }
                              className="rounded-lg border border-lime-400/30 px-3 py-2 text-xs font-semibold text-lime-200 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {assigningRoleUserId === listedUser.id
                                ? "Asignando..."
                                : "Asignar"}
                            </button>
                          </div>
                        </td>
                      )}
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          {canViewUserDetails && (
                            <button
                              type="button"
                              onClick={() => onViewProfile(listedUser)}
                              disabled={viewingUserId === listedUser.id}
                              className="rounded-lg border border-lime-400/30 px-3 py-2 text-xs font-semibold text-lime-200 disabled:opacity-50"
                            >
                              {viewingUserId === listedUser.id
                                ? "Cargando..."
                                : "Ver perfil"}
                            </button>
                          )}
                          {canDeleteUsers && (
                            <button
                              type="button"
                              onClick={() => onDelete(listedUser)}
                              disabled={
                                updatingUserId === listedUser.id ||
                                listedUser.id === currentUserId
                              }
                              title={
                                listedUser.id === currentUserId
                                  ? "No puedes eliminar tu propia cuenta"
                                  : "Eliminar usuario"
                              }
                              className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                            >
                              {updatingUserId === listedUser.id
                                ? "Eliminando..."
                                : "Eliminar"}
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
          )}
        </div>

        <div
          className={`directory-layer ${showProfile ? "directory-layer-active" : "directory-layer-inactive"}`}
          aria-hidden={!showProfile}
          inert={!showProfile || undefined}
        >
          <div className="px-5 py-6 sm:px-7">
            {profileViewError ? (
              <p role="alert" className="text-sm text-red-300">
                {profileViewError}
              </p>
            ) : viewingUserId && !viewedUser ? (
              <p className="text-sm text-slate-400">Cargando perfil...</p>
            ) : viewedUser ? (
              <>
                {canEditViewedProfile && !isEditingViewedProfile && (
                  <div className="mb-4 flex justify-end">
                    <button
                      type="button"
                      onClick={onStartEditViewedProfile}
                      className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016]"
                    >
                      {viewedUser.profile ? "Editar perfil" : "Crear perfil"}
                    </button>
                  </div>
                )}
                {isEditingViewedProfile ? (
                  <ProfileFieldsForm
                    values={viewedProfileForm}
                    latestBirthDate={latestBirthDate}
                    error={viewedProfileError}
                    isSaving={isSavingViewedProfile}
                    inputClassName={inputClassName}
                    onChange={onChangeViewedProfile}
                    onSubmit={onSaveViewedProfile}
                    onCancel={onCancelEditViewedProfile}
                  />
                ) : viewedUser.profile ? (
                  renderProfileDetails(viewedUser.profile)
                ) : (
                  <p className="text-sm text-slate-400">
                    Este usuario aún no tiene perfil.
                  </p>
                )}
                {!isEditingViewedProfile && (
                  <div className="mt-8 border-t border-slate-800 pt-6">
                    <h3 className="text-base font-bold">Roles y permisos</h3>
                    <p className="mt-1 text-sm text-slate-500">
                      Accesos que tiene esta cuenta según los roles asignados.
                    </p>
                    <UserAuthorizationPanel roles={viewedUser.roles} />
                  </div>
                )}
              </>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
};

export default UserDirectory;

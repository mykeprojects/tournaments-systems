import { useCallback, useEffect, useState, type FormEvent } from "react";
import { Link } from "react-router-dom";
import UserDirectory from "../../components/admin/UserDirectory";
import UserAuthorizationPanel from "../../components/profile/UserAuthorizationPanel";
import {
  isValidPhoneNumber,
  PHONE_DIGIT_COUNT,
  PHONE_NUMBER_MESSAGE,
  sanitizePhoneNumber,
} from "../../domain/profile/phoneNumber";
import { useAuth } from "../../hooks/useAuth";
import { routePaths } from "../../routes/routePaths";
import {
  createProfile,
  createUser,
  createUserRole,
  deleteProfile,
  deleteUser,
  getUserDetail,
  getUserServiceErrorMessage,
  listRoles,
  listUserRoleAssignments,
  listUsers,
  updateProfile,
  type Profile,
  type Role,
  type UserDetail,
  type UserRoleAssignment,
  type UserSummary,
} from "../../services/userService";
import {
  getTwoFactorStatus,
  updateTwoFactorPreference,
  type TwoFactorStatus,
} from "../../services/authService";

const EMPTY_USER_FORM = { name: "", email: "", password: "" };
const EMPTY_PROFILE_FORM = { phone: "", photoUrl: "", birthDate: "" };
const PASSWORD_PATTERN = "^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)(?=.*[@$!%*?&])\\S{8,72}$";
const dateBeforeToday = new Date();
dateBeforeToday.setDate(dateBeforeToday.getDate() - 1);
const LATEST_BIRTH_DATE = `${dateBeforeToday.getFullYear()}-${String(
  dateBeforeToday.getMonth() + 1
).padStart(2, "0")}-${String(dateBeforeToday.getDate()).padStart(2, "0")}`;
const INPUT_CLASS =
  "mt-2 w-full rounded-xl border border-slate-700 bg-[#0b1711] px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-lime-400 focus:ring-2 focus:ring-lime-400/20";

const Dashboard = () => {
  const {
    user,
    logout,
    hasPermission,
    permissionCheckError,
    refreshPermissions,
  } = useAuth();
  const canViewUsers = hasPermission("users.view");
  const canViewUserDetails = hasPermission("users.viewDetails");
  const canCreateUsers = hasPermission("users.create");
  const canAssignRoles = hasPermission("users.assignRoles");
  const canDeleteUsers = hasPermission("users.delete");
  const canViewRoles = hasPermission("roles.view");
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [userRoleAssignments, setUserRoleAssignments] = useState<UserRoleAssignment[]>([]);
  const [selectedRoleByUser, setSelectedRoleByUser] = useState<Record<number, string>>({});
  const [isLoadingUsers, setIsLoadingUsers] = useState(canViewUsers);
  const [isLoadingRoleData, setIsLoadingRoleData] = useState(canAssignRoles);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [assigningRoleUserId, setAssigningRoleUserId] = useState<number | null>(null);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [listError, setListError] = useState<string | null>(null);
  const [roleManagementError, setRoleManagementError] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);
  const [updatingUserId, setUpdatingUserId] = useState<number | null>(null);
  const [viewedUser, setViewedUser] = useState<UserDetail | null>(null);
  const [viewingUserId, setViewingUserId] = useState<number | null>(null);
  const [profileViewError, setProfileViewError] = useState<string | null>(null);
  const [accountDetails, setAccountDetails] = useState<UserDetail | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [profileForm, setProfileForm] = useState(EMPTY_PROFILE_FORM);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isDeletingProfile, setIsDeletingProfile] = useState(false);
  const [profileError, setProfileError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [twoFactorStatus, setTwoFactorStatus] = useState<TwoFactorStatus | null>(null);
  const [isUpdatingTwoFactor, setIsUpdatingTwoFactor] = useState(false);
  const [twoFactorError, setTwoFactorError] = useState<string | null>(null);
  const [twoFactorSuccess, setTwoFactorSuccess] = useState<string | null>(null);

  const refreshUsers = useCallback(async () => {
    try {
      setUsers(await listUsers());
    } catch (error) {
      setListError(
        getUserServiceErrorMessage(error, "No fue posible cargar los usuarios.")
      );
    } finally {
      setIsLoadingUsers(false);
    }
  }, []);

  useEffect(() => {
    if (!canViewUsers) {
      return;
    }

    let active = true;
    const loadUsers = async () => {
      try {
        const loadedUsers = await listUsers();
        if (active) {
          setUsers(loadedUsers);
        }
      } catch (error) {
        if (active) {
          setListError(
            getUserServiceErrorMessage(error, "No fue posible cargar los usuarios.")
          );
        }
      } finally {
        if (active) {
          setIsLoadingUsers(false);
        }
      }
    };

    void loadUsers();

    if (!canAssignRoles) {
      return () => {
        active = false;
      };
    }

    void Promise.all([listRoles(), listUserRoleAssignments()])
      .then(([loadedRoles, loadedAssignments]) => {
        if (active) {
          setRoles(loadedRoles);
          setUserRoleAssignments(loadedAssignments);
          setRoleManagementError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setRoleManagementError(
            getUserServiceErrorMessage(error, "No fue posible cargar los roles.")
          );
        }
      })
      .finally(() => {
        if (active) {
          setIsLoadingRoleData(false);
        }
      });

    return () => {
      active = false;
    };
  }, [canAssignRoles, canViewUsers]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    void getUserDetail(user.id)
      .then((details) => {
        if (active) {
          setAccountDetails(details);
          setProfile(details.profile);
          setProfileForm(details.profile
            ? {
                phone: sanitizePhoneNumber(details.profile.phone ?? ""),
                photoUrl: details.profile.photoUrl ?? "",
                birthDate: details.profile.birthDate ?? "",
              }
            : EMPTY_PROFILE_FORM);
        }
      })
      .catch((error: unknown) => {
        if (!active) {
          return;
        }

        setProfileError(
          getUserServiceErrorMessage(error, "No fue posible cargar tus datos.")
        );
      })
      .finally(() => {
        if (active) {
          setIsLoadingProfile(false);
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  useEffect(() => {
    if (!user) {
      return;
    }

    let active = true;
    void getTwoFactorStatus()
      .then((status) => {
        if (active) {
          setTwoFactorStatus(status);
          setTwoFactorError(null);
        }
      })
      .catch((error: unknown) => {
        if (active) {
          setTwoFactorError(
            error instanceof Error
              ? error.message
              : "No fue posible consultar la autenticación de dos factores."
          );
        }
      });

    return () => {
      active = false;
    };
  }, [user]);

  const handleToggleTwoFactor = async () => {
    if (!twoFactorStatus?.available) {
      return;
    }

    const nextEnabled = !twoFactorStatus.enabled;
    const confirmation = nextEnabled
      ? "Al habilitar el segundo factor, el próximo inicio de sesión con correo y contraseña pedirá un código enviado a tu correo."
      : "Si deshabilitas el segundo factor, tu cuenta quedará protegida solo con la contraseña.";

    if (!window.confirm(confirmation)) {
      return;
    }

    setIsUpdatingTwoFactor(true);
    setTwoFactorError(null);
    setTwoFactorSuccess(null);

    try {
      const status = await updateTwoFactorPreference(nextEnabled);
      setTwoFactorStatus(status);
      setTwoFactorSuccess(
        status.enabled
          ? "La autenticación de dos factores quedó habilitada."
          : "La autenticación de dos factores quedó deshabilitada."
      );
    } catch (error) {
      setTwoFactorError(
        error instanceof Error
          ? error.message
          : "No fue posible actualizar la autenticación de dos factores."
      );
    } finally {
      setIsUpdatingTwoFactor(false);
    }
  };

  const handleCreateUser = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canCreateUsers) return;
    setFormError(null);
    setSuccessMessage(null);
    setIsSubmittingUser(true);

    try {
      await createUser({
        name: userForm.name.trim(),
        email: userForm.email.trim(),
        password: userForm.password,
      });
      setUserForm(EMPTY_USER_FORM);
      setIsCreatingUser(false);
      setSuccessMessage("El usuario se creó correctamente.");
      setListError(null);
      setIsLoadingUsers(true);
      await refreshUsers();
    } catch (error) {
      setFormError(
        getUserServiceErrorMessage(error, "No fue posible crear el usuario.")
      );
    } finally {
      setIsSubmittingUser(false);
    }
  };

  const handleDeleteUser = async (targetUser: UserSummary) => {
    if (!canDeleteUsers) return;
    if (targetUser.id === user?.id) {
      setListError("No puedes eliminar la cuenta con la que iniciaste sesión.");
      return;
    }

    if (!window.confirm(`¿Seguro que deseas eliminar a ${targetUser.name}?`)) {
      return;
    }

    setUpdatingUserId(targetUser.id);
    setListError(null);
    setSuccessMessage(null);
    try {
      await deleteUser(targetUser.id);
      if (viewedUser?.id === targetUser.id) {
        setViewedUser(null);
        setProfileViewError(null);
      }
      setSuccessMessage(`El usuario ${targetUser.name} se eliminó correctamente.`);
      setIsLoadingUsers(true);
      await refreshUsers();
    } catch (error) {
      setListError(
        getUserServiceErrorMessage(error, "No fue posible eliminar el usuario.")
      );
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleAssignRole = async (targetUser: UserSummary) => {
    if (!canAssignRoles) return;
    const roleId = Number(selectedRoleByUser[targetUser.id]);
    if (!Number.isSafeInteger(roleId) || roleId <= 0) {
      setRoleManagementError("Selecciona un rol válido para asignar.");
      return;
    }

    const alreadyAssigned = userRoleAssignments.some(
      (assignment) =>
        assignment.userId === targetUser.id && assignment.role.id === roleId
    );
    if (alreadyAssigned) {
      setRoleManagementError("El usuario ya tiene asignado ese rol.");
      return;
    }

    setAssigningRoleUserId(targetUser.id);
    setRoleManagementError(null);
    setSuccessMessage(null);

    try {
      const assignment = await createUserRole({
        userId: targetUser.id,
        roleId,
      });
      setUserRoleAssignments((current) => [...current, assignment]);
      setSelectedRoleByUser((current) => ({ ...current, [targetUser.id]: "" }));
      setSuccessMessage(`El rol ${assignment.role.name} se asignó a ${targetUser.name}.`);
    } catch (error) {
      setRoleManagementError(
        getUserServiceErrorMessage(error, "No fue posible asignar el rol.")
      );
    } finally {
      setAssigningRoleUserId(null);
    }
  };

  const handleViewProfile = async (targetUser: UserSummary) => {
    if (!canViewUserDetails) return;
    setViewedUser(null);
    setViewingUserId(targetUser.id);
    setProfileViewError(null);

    try {
      setViewedUser(await getUserDetail(targetUser.id));
    } catch (error) {
      setProfileViewError(
        getUserServiceErrorMessage(error, "No fue posible consultar el perfil.")
      );
    } finally {
      setViewingUserId(null);
    }
  };

  const handleSaveProfile = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!user) {
      return;
    }

    setProfileError(null);
    setSuccessMessage(null);
    const phone = sanitizePhoneNumber(profileForm.phone);
    if (!isValidPhoneNumber(phone)) {
      setProfileError(PHONE_NUMBER_MESSAGE);
      return;
    }

    setIsSavingProfile(true);
    const profileData = {
      phone,
      photoUrl: profileForm.photoUrl.trim() || null,
      birthDate: profile?.birthDate ?? profileForm.birthDate,
    };

    try {
      const savedProfile = profile
        ? await updateProfile(user.id, profileData)
        : await createProfile(user.id, profileData);
      setProfile(savedProfile);
      setProfileForm({
        phone: savedProfile.phone ?? "",
        photoUrl: savedProfile.photoUrl ?? "",
        birthDate: savedProfile.birthDate ?? "",
      });
      setIsEditingProfile(false);
      setSuccessMessage("Tu perfil se guardó correctamente.");
    } catch (error) {
      setProfileError(
        getUserServiceErrorMessage(error, "No fue posible guardar tu perfil.")
      );
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteOwnProfile = async () => {
    if (!user || !profile) {
      return;
    }

    if (!window.confirm("¿Seguro que deseas eliminar tu perfil? Esta acción no se puede deshacer.")) {
      return;
    }

    setIsDeletingProfile(true);
    setProfileError(null);
    setSuccessMessage(null);

    try {
      await deleteProfile(user.id);
      setProfile(null);
      setProfileForm(EMPTY_PROFILE_FORM);
      setIsEditingProfile(false);
      setSuccessMessage("Tu perfil se eliminó correctamente.");
    } catch (error) {
      setProfileError(
        getUserServiceErrorMessage(error, "No fue posible eliminar tu perfil.")
      );
    } finally {
      setIsDeletingProfile(false);
    }
  };

  const renderProfileDetails = (details: Profile | null) => (
    <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
      <div>
        <dt className="text-slate-500">Teléfono</dt>
        <dd className="mt-1 text-slate-200">{details?.phone || "Sin registrar"}</dd>
      </div>
      <div>
        <dt className="text-slate-500">Fecha de nacimiento</dt>
        <dd className="mt-1 text-slate-200">{details?.birthDate || "Sin registrar"}</dd>
      </div>
      <div className="sm:col-span-2">
        <dt className="text-slate-500">Foto de perfil</dt>
        {details?.photoUrl ? (
          <dd className="mt-2">
            <img
              src={details.photoUrl}
              alt="Foto de perfil"
              className="h-24 w-24 rounded-full object-cover"
            />
          </dd>
        ) : (
          <dd className="mt-1 text-slate-400">Sin registrar</dd>
        )}
      </div>
    </dl>
  );

  const handleLogout = () => void logout();
  const handleRefreshUsers = () => {
    if (!canViewUsers) return;
    setListError(null);
    setIsLoadingUsers(true);
    void refreshUsers();
    if (!canAssignRoles) return;
    setIsLoadingRoleData(true);
    void Promise.all([listRoles(), listUserRoleAssignments()])
      .then(([loadedRoles, loadedAssignments]) => {
        setRoles(loadedRoles);
        setUserRoleAssignments(loadedAssignments);
        setRoleManagementError(null);
      })
      .catch((error: unknown) => {
        setRoleManagementError(
          getUserServiceErrorMessage(error, "No fue posible actualizar los roles.")
        );
      })
      .finally(() => setIsLoadingRoleData(false));
  };

  const renderOwnProfileSection = () => {
    return (
      <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-7">
        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-start">
          <div>
            <h2 className="text-xl font-bold">Datos de la cuenta</h2>
            <dl className="mt-4 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-slate-500">Nombre</dt>
                <dd className="mt-1 text-slate-200">
                  {accountDetails?.name || (isLoadingProfile ? "Cargando..." : "No disponible")}
                </dd>
              </div>
              <div>
                <dt className="text-slate-500">Correo electrónico</dt>
                <dd className="mt-1 text-slate-200">{user?.email}</dd>
              </div>
            </dl>
          </div>
          {!isEditingProfile && (
            <button
              type="button"
              onClick={() => {
                setProfileError(null);
                setSuccessMessage(null);
                setIsEditingProfile(true);
              }}
              disabled={isLoadingProfile || Boolean(profileError)}
              className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016]"
            >
              {profile ? "Editar perfil" : "Crear perfil"}
            </button>
          )}
        </div>

        {successMessage && (
          <p role="status" className="mt-5 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
            {successMessage}
          </p>
        )}
        {profileError && <p role="alert" className="mt-5 text-sm text-red-300">{profileError}</p>}
        {isLoadingProfile ? (
          <p className="mt-6 text-sm text-slate-400">Cargando perfil...</p>
        ) : profileError ? null : isEditingProfile ? (
          <form onSubmit={(event) => void handleSaveProfile(event)} className="mt-6">
            <div className="grid gap-5 sm:grid-cols-2">
              <div>
                <label htmlFor="profile-phone" className="text-sm font-semibold text-slate-200">
                  Teléfono
                </label>
                <input
                  id="profile-phone"
                  type="tel"
                  inputMode="numeric"
                  autoComplete="tel"
                  required
                  maxLength={PHONE_DIGIT_COUNT}
                  pattern={`\\d{${PHONE_DIGIT_COUNT}}`}
                  title={PHONE_NUMBER_MESSAGE}
                  value={profileForm.phone ?? ""}
                  onChange={(event) =>
                    setProfileForm((current) => ({
                      ...current,
                      phone: sanitizePhoneNumber(event.target.value),
                    }))
                  }
                  className={INPUT_CLASS}
                />
                <p className="mt-2 text-xs text-slate-500">
                  Exactamente {PHONE_DIGIT_COUNT} dígitos, sin espacios ni símbolos.
                </p>
              </div>
              <div>
                <label htmlFor="profile-photo" className="text-sm font-semibold text-slate-200">
                  URL de la foto de perfil
                </label>
                <input
                  id="profile-photo"
                  type="url"
                  maxLength={2048}
                  value={profileForm.photoUrl ?? ""}
                  onChange={(event) =>
                    setProfileForm((current) => ({ ...current, photoUrl: event.target.value }))
                  }
                  className={INPUT_CLASS}
                />
              </div>
              {!profile && (
                <div>
                  <label htmlFor="profile-birth-date" className="text-sm font-semibold text-slate-200">
                    Fecha de nacimiento
                  </label>
                  <input
                    id="profile-birth-date"
                    type="date"
                    required
                    max={LATEST_BIRTH_DATE}
                    value={profileForm.birthDate ?? ""}
                    onChange={(event) =>
                      setProfileForm((current) => ({ ...current, birthDate: event.target.value }))
                    }
                    className={INPUT_CLASS}
                  />
                </div>
              )}
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile(false);
                  setProfileForm(
                    profile
                      ? {
                          phone: sanitizePhoneNumber(profile.phone ?? ""),
                          photoUrl: profile.photoUrl ?? "",
                          birthDate: profile.birthDate ?? "",
                        }
                      : EMPTY_PROFILE_FORM
                  );
                }}
                className="rounded-xl border border-slate-700 px-5 py-3 text-sm font-semibold text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="submit"
                disabled={isSavingProfile}
                className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] disabled:opacity-60"
              >
                {isSavingProfile ? "Guardando..." : "Guardar perfil"}
              </button>
            </div>
          </form>
        ) : profile ? (
          <>
            {renderProfileDetails(profile)}
            <div className="mt-6 flex justify-end">
              <button
                type="button"
                onClick={() => void handleDeleteOwnProfile()}
                disabled={isDeletingProfile}
                className="rounded-xl border border-red-500/30 px-5 py-3 text-sm font-semibold text-red-300 disabled:opacity-60"
              >
                {isDeletingProfile ? "Eliminando..." : "Eliminar perfil"}
              </button>
            </div>
          </>
        ) : (
          <p className="mt-6 text-sm text-slate-400">
            Aún no tienes un perfil. Usa “Crear perfil” para añadir tus datos.
          </p>
        )}
        {!isEditingProfile && !isLoadingProfile && !profileError && (
          <div className="mt-8 border-t border-slate-800 pt-6">
            <h3 className="text-base font-bold">Roles y permisos</h3>
            <p className="mt-1 text-sm text-slate-500">
              Accesos que tiene tu cuenta según los roles asignados.
            </p>
            <UserAuthorizationPanel roles={accountDetails?.roles} />
          </div>
        )}
      </section>
    );
  };

  return (
    <main className="min-h-screen bg-[#07110d] text-white">
      <header className="border-b border-slate-800 bg-[#0a1510]">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-5 py-4 sm:px-8">
          <div className="flex items-center gap-3">
            <span className="flex h-10 w-10 items-center justify-center rounded-xl bg-lime-400 text-lg font-black text-[#102016]">
              +
            </span>
            <div>
              <p className="font-black tracking-tight">
                Sports System<span className="text-lime-400">+</span>
              </p>
              <p className="text-xs text-slate-500">
                {canViewUsers ? "Administración" : "Mi cuenta"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <span className="hidden text-sm text-slate-400 sm:inline">{user?.email}</span>
            <button
              type="button"
              onClick={handleLogout}
              className="rounded-lg border border-slate-700 px-3 py-2 text-sm font-semibold text-slate-300 transition hover:border-red-400/50 hover:text-red-300"
            >
              Cerrar sesión
            </button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl px-5 py-8 sm:px-8 sm:py-12">
        <div className="mb-8">
          <p className="mb-2 text-xs font-bold uppercase tracking-[0.24em] text-lime-400">
            Panel de control
          </p>
          <h1 className="text-3xl font-black tracking-tight sm:text-4xl">
            {canViewUsers ? "Gestión de usuarios" : "Mi perfil"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {canViewUsers
              ? "Consulta las cuentas registradas y administra sus perfiles."
              : "Consulta tus datos y actualiza tu teléfono y foto de perfil."}
          </p>
        </div>

        {!canViewUsers && renderOwnProfileSection()}

        {twoFactorStatus?.available && (
          <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-7">
            <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
              <div>
                <h2 className="text-xl font-bold">Autenticación de dos factores</h2>
                <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
                  {twoFactorStatus.enabled
                    ? "Tu cuenta pide un código enviado al correo después de validar la contraseña."
                    : "Agrega un código temporal al iniciar sesión con correo y contraseña."}
                </p>
              </div>
              <button
                type="button"
                onClick={() => void handleToggleTwoFactor()}
                disabled={isUpdatingTwoFactor}
                className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] disabled:opacity-60"
              >
                {isUpdatingTwoFactor
                  ? "Guardando..."
                  : twoFactorStatus.enabled
                    ? "Deshabilitar 2FA"
                    : "Habilitar 2FA"}
              </button>
            </div>
            {twoFactorSuccess && (
              <p role="status" className="mt-4 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
                {twoFactorSuccess}
              </p>
            )}
            {twoFactorError && (
              <p role="alert" className="mt-4 text-sm text-red-300">
                {twoFactorError}
              </p>
            )}
          </section>
        )}

        {permissionCheckError ? (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p role="alert" className="text-sm text-red-300">
              No fue posible consultar los permisos de tu cuenta: {permissionCheckError}
            </p>
            <button
              type="button"
              onClick={() => void refreshPermissions()}
              className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200"
            >
              Reintentar
            </button>
          </section>
        ) : canViewUsers || canCreateUsers || canViewRoles ? (
          <>
            <div className="mb-6 flex flex-wrap justify-end gap-3">
              {canViewRoles && (
                <Link
                  to={routePaths.roles}
                  className="inline-flex items-center justify-center rounded-xl border border-slate-700 px-5 py-3 text-sm font-bold text-slate-200 transition hover:border-lime-400/40 hover:text-lime-200"
                >
                  Ver roles
                </Link>
              )}
              {canCreateUsers && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCreatingUser((open) => !open);
                    setFormError(null);
                    setSuccessMessage(null);
                  }}
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] transition hover:bg-lime-300"
                >
                  <span aria-hidden="true" className="text-lg leading-none">+</span>
                  {isCreatingUser ? "Cancelar" : "Crear usuario"}
                </button>
              )}
            </div>

            {successMessage && (
              <p role="status" className="mb-5 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
                {successMessage}
              </p>
            )}
            {roleManagementError && (
              <p role="alert" className="mb-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-300">
                {roleManagementError}
              </p>
            )}

            {isCreatingUser && canCreateUsers && (
              <section className="mb-8 rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-7">
                <h2 className="text-xl font-bold">Nuevo usuario</h2>
                {formError && (
                  <p role="alert" className="mt-4 text-sm text-red-300">{formError}</p>
                )}
                <form onSubmit={(event) => void handleCreateUser(event)} className="mt-5">
                  <div className="grid gap-5 sm:grid-cols-2">
                    <div>
                      <label htmlFor="user-name" className="text-sm font-semibold text-slate-200">
                        Nombre completo
                      </label>
                      <input
                        id="user-name"
                        type="text"
                        autoComplete="name"
                        required
                        minLength={2}
                        maxLength={100}
                        value={userForm.name}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, name: event.target.value }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div>
                      <label htmlFor="user-email" className="text-sm font-semibold text-slate-200">
                        Correo electrónico
                      </label>
                      <input
                        id="user-email"
                        type="email"
                        autoComplete="email"
                        required
                        value={userForm.email}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, email: event.target.value }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                    <div className="sm:col-span-2">
                      <label htmlFor="user-password" className="text-sm font-semibold text-slate-200">
                        Contraseña inicial
                      </label>
                      <input
                        id="user-password"
                        type="password"
                        autoComplete="new-password"
                        required
                        minLength={8}
                        maxLength={72}
                        pattern={PASSWORD_PATTERN}
                        title="Usa de 8 a 72 caracteres, mayúscula, minúscula, número y un símbolo de @$!%*?&; no uses espacios."
                        value={userForm.password}
                        onChange={(event) =>
                          setUserForm((current) => ({ ...current, password: event.target.value }))
                        }
                        className={INPUT_CLASS}
                      />
                    </div>
                  </div>
                  <div className="mt-6 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmittingUser}
                      className="rounded-xl bg-lime-400 px-5 py-3 text-sm font-extrabold text-[#102016] disabled:opacity-60"
                    >
                      {isSubmittingUser ? "Creando..." : "Guardar usuario"}
                    </button>
                  </div>
                </form>
              </section>
            )}

            {canViewUsers && (
              <UserDirectory
                users={users}
                roles={roles}
                userRoleAssignments={userRoleAssignments}
                selectedRoleByUser={selectedRoleByUser}
                isLoadingUsers={isLoadingUsers}
                isLoadingRoleData={isLoadingRoleData}
                listError={listError}
                currentUserId={user?.id}
                updatingUserId={updatingUserId}
                assigningRoleUserId={assigningRoleUserId}
                viewingUserId={viewingUserId}
                viewedUser={viewedUser}
                profileViewError={profileViewError}
                canAssignRoles={canAssignRoles}
                canViewUserDetails={canViewUserDetails}
                canDeleteUsers={canDeleteUsers}
                renderProfileDetails={renderProfileDetails}
                onRefresh={handleRefreshUsers}
                onSelectRole={(userId, roleId) =>
                  setSelectedRoleByUser((current) => ({
                    ...current,
                    [userId]: roleId,
                  }))
                }
                onAssignRole={(listedUser) => void handleAssignRole(listedUser)}
                onViewProfile={(listedUser) => void handleViewProfile(listedUser)}
                onCloseProfile={() => {
                  setViewedUser(null);
                  setProfileViewError(null);
                }}
                onDelete={(listedUser) => void handleDeleteUser(listedUser)}
              />
            )}
          </>
        ) : null}
      </div>
    </main>
  );
};

export default Dashboard;

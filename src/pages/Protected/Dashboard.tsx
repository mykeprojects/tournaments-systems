import { useCallback, useEffect, useState, type FormEvent } from "react";
import { useAuth } from "../../hooks/useAuth";
import {
  createProfile,
  createUser,
  deleteUser,
  getUserDetail,
  getUserServiceErrorMessage,
  listUsers,
  updateProfile,
  type Profile,
  type UserDetail,
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
  const { user, logout, isAdmin, roleCheckError, refreshAdminStatus } = useAuth();
  const [users, setUsers] = useState<UserSummary[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState(true);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isSubmittingUser, setIsSubmittingUser] = useState(false);
  const [userForm, setUserForm] = useState(EMPTY_USER_FORM);
  const [listError, setListError] = useState<string | null>(null);
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
    if (!isAdmin) {
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
    return () => {
      active = false;
    };
  }, [isAdmin]);

  useEffect(() => {
    if (isAdmin !== false || !user) {
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
                phone: details.profile.phone ?? "",
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
  }, [isAdmin, user]);

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

  const handleViewProfile = async (targetUser: UserSummary) => {
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
    setIsSavingProfile(true);
    const profileData = {
      phone: profileForm.phone.trim(),
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
    setListError(null);
    setIsLoadingUsers(true);
    void refreshUsers();
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
                {isAdmin ? "Administración" : "Mi cuenta"}
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
            {isAdmin ? "Gestión de usuarios" : "Mi perfil"}
          </h1>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-400">
            {isAdmin
              ? "Consulta las cuentas registradas y administra sus perfiles."
              : "Consulta tus datos y actualiza tu teléfono y foto de perfil."}
          </p>
        </div>

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

        {roleCheckError ? (
          <section className="rounded-2xl border border-red-500/30 bg-red-500/10 p-6">
            <p role="alert" className="text-sm text-red-300">
              No fue posible verificar si tu cuenta es administradora: {roleCheckError}
            </p>
            <button
              type="button"
              onClick={() => void refreshAdminStatus()}
              className="mt-4 rounded-lg border border-red-400/40 px-4 py-2 text-sm font-semibold text-red-200"
            >
              Reintentar
            </button>
          </section>
        ) : isAdmin === null ? (
          <p className="text-sm text-slate-400">Verificando permisos...</p>
        ) : isAdmin ? (
          <>
            <div className="mb-6 flex justify-end">
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
            </div>

            {successMessage && (
              <p role="status" className="mb-5 rounded-xl border border-lime-400/20 bg-lime-400/10 px-4 py-3 text-sm text-lime-200">
                {successMessage}
              </p>
            )}

            {isCreatingUser && (
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

            <section className="overflow-hidden rounded-2xl border border-slate-800 bg-[#0b1711]">
              <div className="flex items-center justify-between gap-4 border-b border-slate-800 px-5 py-5 sm:px-7">
                <div>
                  <h2 className="font-bold">Usuarios registrados</h2>
                  <p className="mt-1 text-sm text-slate-500">
                    {isLoadingUsers ? "Cargando..." : `${users.length} usuarios`}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={handleRefreshUsers}
                  disabled={isLoadingUsers}
                  className="rounded-lg border border-slate-700 px-3 py-2 text-xs font-semibold text-slate-300 disabled:opacity-50"
                >
                  Actualizar
                </button>
              </div>
              {listError && <p role="alert" className="px-6 py-4 text-sm text-red-300">{listError}</p>}
              {isLoadingUsers ? (
                <p className="px-6 py-10 text-center text-sm text-slate-400">Cargando usuarios...</p>
              ) : users.length === 0 ? (
                <p className="px-6 py-10 text-center text-sm text-slate-400">
                  Aún no hay usuarios registrados.
                </p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full min-w-[760px] text-left text-sm">
                    <thead className="bg-white/[0.02] text-xs uppercase tracking-wider text-slate-500">
                      <tr>
                        <th scope="col" className="px-6 py-4 font-semibold">ID</th>
                        <th scope="col" className="px-6 py-4 font-semibold">Nombre</th>
                        <th scope="col" className="px-6 py-4 font-semibold">Correo electrónico</th>
                        <th scope="col" className="px-6 py-4 font-semibold">Acciones</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800">
                      {users.map((listedUser) => (
                        <tr key={listedUser.id} className="transition hover:bg-white/[0.02]">
                          <td className="px-6 py-4 text-slate-500">{listedUser.id}</td>
                          <td className="px-6 py-4 font-semibold text-slate-200">{listedUser.name}</td>
                          <td className="px-6 py-4 text-slate-400">{listedUser.email}</td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <button
                                type="button"
                                onClick={() => void handleViewProfile(listedUser)}
                                disabled={viewingUserId === listedUser.id}
                                className="rounded-lg border border-lime-400/30 px-3 py-2 text-xs font-semibold text-lime-200 disabled:opacity-50"
                              >
                                {viewingUserId === listedUser.id ? "Cargando..." : "Ver perfil"}
                              </button>
                              <button
                                type="button"
                                onClick={() => void handleDeleteUser(listedUser)}
                                disabled={updatingUserId === listedUser.id || listedUser.id === user?.id}
                                title={listedUser.id === user?.id ? "No puedes eliminar tu propia cuenta" : "Eliminar usuario"}
                                className="rounded-lg border border-red-500/30 px-3 py-2 text-xs font-semibold text-red-300 disabled:cursor-not-allowed disabled:opacity-40"
                              >
                                {updatingUserId === listedUser.id ? "Eliminando..." : "Eliminar"}
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {(viewedUser || profileViewError) && (
              <section className="mt-6 rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-7">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <h2 className="text-xl font-bold">Perfil del usuario</h2>
                    {viewedUser && (
                      <p className="mt-2 text-sm text-slate-400">
                        {viewedUser.name} · {viewedUser.email}
                      </p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setViewedUser(null);
                      setProfileViewError(null);
                    }}
                    className="text-sm text-slate-400 hover:text-white"
                  >
                    Cerrar
                  </button>
                </div>
                {profileViewError ? (
                  <p role="alert" className="mt-4 text-sm text-red-300">{profileViewError}</p>
                ) : viewedUser?.profile ? (
                  renderProfileDetails(viewedUser.profile)
                ) : (
                  <p className="mt-4 text-sm text-slate-400">Este usuario aún no tiene perfil.</p>
                )}
              </section>
            )}
          </>
        ) : (
          <section className="rounded-2xl border border-slate-800 bg-[#0b1711] p-5 sm:p-7">
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
                  Editar perfil
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
                      required
                      maxLength={30}
                      value={profileForm.phone ?? ""}
                      onChange={(event) =>
                        setProfileForm((current) => ({ ...current, phone: event.target.value }))
                      }
                      className={INPUT_CLASS}
                    />
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
                              phone: profile.phone ?? "",
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
              renderProfileDetails(profile)
            ) : (
              <p className="mt-6 text-sm text-slate-400">
                Aún no tienes un perfil. Usa “Editar perfil” para añadir tus datos.
              </p>
            )}
          </section>
        )}
      </div>
    </main>
  );
};

export default Dashboard;

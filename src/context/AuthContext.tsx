import React, { useEffect, useState } from "react";
import {
  registerUnauthorizedHandler,
  setTokenProvider,
} from "../interceptors/apiClient";
import {
  login,
  loginWithExternalProvider,
  logout as logoutFromBackend,
  verifyTwoFactor,
} from "../services/authService";
import { getUserIdFromToken } from "../domain/auth/token";
import { hasPermission as checkPermission } from "../domain/authorization/permissionAccess";
import { listCurrentUserPermissions } from "../services/authorizationService";
import type { AuthSessionResponse } from "../models/auth";
import type { Permission, PermissionKey } from "../models/authorization";
import type { CredentialsLoginResult } from "./AuthContextDefinition";
import type { AuthProviderType } from "../domain/auth";
import { getUserRoleAssignments } from "../services/userService";
import type { Role } from "../models/user";
import {
  clearAuthSession,
  getAuthSession,
  getAuthToken,
  saveAuthSession,
} from "../storage/authSession";
import {
  AuthContext,
  type AuthenticatedUser,
} from "./AuthContextDefinition";
import apiClient from "../interceptors/apiClient";

interface StoredSession {
  user: AuthenticatedUser | null;
  expiresAt: number | null;
}

interface UserRolesResponse {
  roles?: Array<{ role: { name: string } }>;
}

const fetchRoleName = async (userId: number): Promise<string | null> => {
  try {
    const response = await apiClient.get<UserRolesResponse>(
      `/api/users/${userId}/detail-with-roles`
    );
    const firstName = response.data?.roles?.[0]?.role?.name ?? null;
    return firstName;
  } catch {
    return null;
  }
};

const readStoredSession = (): StoredSession => {
  const session = getAuthSession();
  if (!session) {
    return { user: null, expiresAt: null };
  }

  const expiresAt = Date.parse(session.expiresAt);

  if (!session.token || !session.email || !Number.isFinite(expiresAt) || expiresAt <= Date.now()) {
    clearAuthSession();
    return { user: null, expiresAt: null };
  }

  try {
    return {
      user: { email: session.email, id: getUserIdFromToken(session.token) },
      expiresAt,
    };
  } catch {
    clearAuthSession();
    return { user: null, expiresAt: null };
  }
};

const clearStoredSession = (): void => {
  clearAuthSession();
};

export const AuthContextProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [storedSession] = useState(readStoredSession);
  const [user, setUser] = useState(storedSession.user);
  const [expiresAt, setExpiresAt] = useState(storedSession.expiresAt);
  const [loading, setLoading] = useState(Boolean(storedSession.user));
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [roles, setRoles] = useState<Role[]>([]);
  const [roleLoading, setRoleLoading] = useState(Boolean(storedSession.user));
  const [roleLoadError, setRoleLoadError] = useState<string | null>(null);
  const [permissionCheckError, setPermissionCheckError] = useState<string | null>(null);
  const [roleName, setRoleName] = useState<string | null>(null);

  useEffect(() => {
    setTokenProvider(async () => getAuthToken());
    const unregisterUnauthorizedHandler = registerUnauthorizedHandler(() => {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setPermissions([]);
      setRoles([]);
      setRoleLoading(false);
      setRoleLoadError(null);
      setPermissionCheckError(null);
      setRoleName(null);
    });

    if (!storedSession.user) {
      clearStoredSession();
    } else {
      void Promise.all([
        listCurrentUserPermissions(storedSession.user.id),
        fetchRoleName(storedSession.user.id),
      ])
        .then(([loadedPermissions, loadedRoleName]) => {
          setPermissions(loadedPermissions);
          setRoleName(loadedRoleName);
          setPermissionCheckError(null);
        })
        .catch((error: unknown) => {
          setPermissions([]);
          setRoleName(null);
          setPermissionCheckError(
            error instanceof Error
              ? error.message
              : "No fue posible consultar los permisos de esta cuenta."
          );
        })
        .finally(() => setLoading(false));
      void getUserRoleAssignments(storedSession.user.id)
        .then((assignments) => {
          setRoles(assignments.map((assignment) => assignment.role));
          setRoleLoadError(null);
        })
        .catch((error: unknown) => {
          setRoles([]);
          setRoleLoadError(
            error instanceof Error
              ? error.message
              : "No fue posible consultar los roles de esta cuenta."
          );
        })
        .finally(() => setRoleLoading(false));
    }

    return () => {
      unregisterUnauthorizedHandler();
      setTokenProvider(null);
    };
  }, [storedSession.user]);

  useEffect(() => {
    if (!user || !expiresAt) {
      return;
    }

    const timeout = window.setTimeout(() => {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setPermissions([]);
      setRoles([]);
      setRoleLoading(false);
      setRoleLoadError(null);
      setPermissionCheckError(null);
      setRoleName(null);
    }, Math.max(0, expiresAt - Date.now()));

    return () => window.clearTimeout(timeout);
  }, [user, expiresAt]);

  const applyAuthenticatedSession = async (
    session: AuthSessionResponse,
    email: string
  ): Promise<void> => {
    const expirationTime = Date.parse(session.expiresAt);

    if (!session.accessToken || !Number.isFinite(expirationTime) || expirationTime <= Date.now()) {
      throw new Error("El backend devolvió una sesión inválida o vencida.");
    }

    const userId = getUserIdFromToken(session.accessToken);
    saveAuthSession(session.accessToken, session.expiresAt, email);
    setUser({ email, id: userId });
    setExpiresAt(expirationTime);
    setPermissions([]);
    setRoles([]);
    setRoleLoadError(null);
    setPermissionCheckError(null);
    setRoleName(null);
    setLoading(true);
    setRoleLoading(true);

    const [permissionResult, roleResult, roleNameResult] = await Promise.allSettled([
      listCurrentUserPermissions(userId),
      getUserRoleAssignments(userId),
      fetchRoleName(userId),
    ]);
    if (permissionResult.status === "fulfilled") {
      setPermissions(permissionResult.value);
      setPermissionCheckError(null);
    } else {
      setPermissions([]);
      setPermissionCheckError(
        permissionResult.reason instanceof Error
          ? permissionResult.reason.message
          : "No fue posible consultar los permisos de esta cuenta."
      );
    }
    if (roleResult.status === "fulfilled") {
      setRoles(roleResult.value.map((assignment) => assignment.role));
      setRoleLoadError(null);
    } else {
      setRoles([]);
      setRoleLoadError(
        roleResult.reason instanceof Error
          ? roleResult.reason.message
          : "No fue posible consultar los roles de esta cuenta."
      );
    }
    setRoleName(roleNameResult.status === "fulfilled" ? roleNameResult.value : null);
    setLoading(false);
    setRoleLoading(false);
  };

  const loginWithCredentials = async (
    email: string,
    password: string
  ): Promise<CredentialsLoginResult> => {
    const session = await login(email, password);

    if (session.requiresTwoFactor) {
      if (!session.challengeToken) {
        throw new Error("El backend no devolvió el token de verificación de dos factores.");
      }

      return {
        requiresTwoFactor: true,
        challengeToken: session.challengeToken,
        expiresAt: session.expiresAt ?? "",
        message: session.message ?? undefined,
      };
    }

    if (!session.accessToken || !session.expiresAt) {
      throw new Error("El backend devolvió una sesión inválida o vencida.");
    }

    await applyAuthenticatedSession(
      {
        accessToken: session.accessToken,
        tokenType: session.tokenType ?? "Bearer",
        expiresAt: session.expiresAt,
      },
      email
    );
    return { requiresTwoFactor: false };
  };

  const completeTwoFactorLogin = async (
    challengeToken: string,
    code: string,
    email: string
  ): Promise<void> => {
    const session = await verifyTwoFactor(challengeToken, code);
    await applyAuthenticatedSession(session, email);
  };

  const loginWithProvider = async (provider: AuthProviderType): Promise<void> => {
    const { default: firebaseAuthAdapter } = await import(
      "../infrastructure/firebase/FirebaseAuthAdapter"
    );
    const identity = await firebaseAuthAdapter.loginWithProvider(provider);
    let session;
    try {
      session = await loginWithExternalProvider(provider, identity.idToken);
    } catch (error) {
      await firebaseAuthAdapter.logout();
      throw error;
    }
    const email = identity.user.email;
    if (!email) {
      throw new Error("El proveedor externo no devolvió un correo válido.");
    }

    await applyAuthenticatedSession(session, email);
  };

  const refreshPermissions = async (): Promise<void> => {
    if (!user) {
      return;
    }

    setLoading(true);
    setRoleLoading(true);
    setPermissionCheckError(null);
    setRoleLoadError(null);

    const [permissionResult, roleResult, roleNameResult] = await Promise.allSettled([
      listCurrentUserPermissions(user.id),
      getUserRoleAssignments(user.id),
      fetchRoleName(user.id),
    ]);
    if (permissionResult.status === "fulfilled") {
      setPermissions(permissionResult.value);
    } else {
      setPermissions([]);
      setPermissionCheckError(
        permissionResult.reason instanceof Error
          ? permissionResult.reason.message
          : "No fue posible consultar los permisos de esta cuenta."
      );
    }
    if (roleResult.status === "fulfilled") {
      setRoles(roleResult.value.map((assignment) => assignment.role));
    } else {
      setRoles([]);
      setRoleLoadError(
        roleResult.reason instanceof Error
          ? roleResult.reason.message
          : "No fue posible consultar los roles de esta cuenta."
      );
    }
    setRoleName(roleNameResult.status === "fulfilled" ? roleNameResult.value : null);
    setLoading(false);
    setRoleLoading(false);
  };

  const logout = async (): Promise<void> => {
    try {
      await logoutFromBackend();
    } finally {
      clearStoredSession();
      setUser(null);
      setExpiresAt(null);
      setPermissions([]);
      setRoles([]);
      setRoleLoading(false);
      setRoleLoadError(null);
      setPermissionCheckError(null);
      setRoleName(null);
      setLoading(false);
    }
  };

  const hasPermission = (permission: PermissionKey): boolean =>
    checkPermission(permissions, permission);

  const value = {
    user,
    loading,
    permissions,
    roles,
    roleLoading,
    roleLoadError,
    permissionCheckError,
    roleName,
    hasPermission,
    loginWithCredentials,
    completeTwoFactorLogin,
    loginWithProvider,
    refreshPermissions,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

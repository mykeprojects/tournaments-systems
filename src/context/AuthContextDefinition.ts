import { createContext } from "react";
import type { AuthProviderType } from "../domain/auth";
import type { Permission } from "../services/roleService";
import type { PermissionKey } from "../services/authorizationService";

export interface AuthenticatedUser {
  email: string;
  id: number;
}

export type CredentialsLoginResult =
  | { requiresTwoFactor: false }
  | { requiresTwoFactor: true; challengeToken: string; expiresAt: string; message?: string };

export interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  permissions: Permission[];
  permissionCheckError: string | null;
  hasPermission: (permission: PermissionKey) => boolean;
  loginWithCredentials: (email: string, password: string) => Promise<CredentialsLoginResult>;
  completeTwoFactorLogin: (
    challengeToken: string,
    code: string,
    email: string
  ) => Promise<void>;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  refreshPermissions: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

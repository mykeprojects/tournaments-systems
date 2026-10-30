import { createContext } from "react";
import type { AuthProviderType } from "../domain/auth";

export interface AuthenticatedUser {
  email: string;
  id: number;
}

export interface AuthContextType {
  user: AuthenticatedUser | null;
  loading: boolean;
  isAdmin: boolean | null;
  roleCheckError: string | null;
  loginWithCredentials: (email: string, password: string) => Promise<void>;
  loginWithProvider: (provider: AuthProviderType) => Promise<void>;
  refreshAdminStatus: () => Promise<void>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

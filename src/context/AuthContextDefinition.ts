import { createContext } from "react";

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
  refreshAdminStatus: () => Promise<void>;
  logout: () => void;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

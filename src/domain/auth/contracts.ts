import type {
  AuthProviderType,
  AuthSessionResponseDTO,
  IdentityProviderResult,
  IdentityUser,
  LoginCredentials,
} from "./entities";

export type SessionStrategyType = "cookie" | "bearer";

export interface IAuthIdentityProvider {
  getCurrentUser(): IdentityUser | null;
  getIdToken(forceRefresh?: boolean): Promise<string>;
  onAuthStateChanged(callback: (user: IdentityUser | null) => void): () => void;
  loginWithEmailPassword(credentials: LoginCredentials): Promise<IdentityProviderResult>;
  loginWithProvider(provider: AuthProviderType): Promise<IdentityProviderResult>;
  logout(): Promise<void>;
}

export interface IAuthBackendService {
  loginWithIdToken(idToken: string): Promise<AuthSessionResponseDTO>;
  getCurrentSession(): Promise<AuthSessionResponseDTO>;
  logout(): Promise<void>;
}

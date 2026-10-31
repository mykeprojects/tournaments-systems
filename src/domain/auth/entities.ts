export interface AppProfile {
  id: string;
  first_name: string;
  last_name: string;
  phone?: string;
  identification?: string;
}

export interface AppUser {
  id: string | number;
  email: string;
  role?: string;
  code?: string;
  profile?: AppProfile;
  name?: string;
}

export type AuthProviderType = "google" | "github" | "microsoft";

export interface IdentityUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  photoURL: string | null;
}

export interface IdentityProviderResult {
  user: IdentityUser;
  idToken: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface AuthSession {
  accessToken: string;
  expiresAt: string;
}

export interface AuthSessionResponseDTO {
  user: AppUser;
  token?: string;
  message?: string;
}

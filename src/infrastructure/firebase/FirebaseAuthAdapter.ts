import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
  type Auth,
  type AuthProvider,
  type User as FirebaseUser,
} from "firebase/auth";
import { auth, authProviders } from "../../firebaseConfig";
import type {
  AuthProviderType,
  IAuthIdentityProvider,
  IdentityProviderResult,
  IdentityUser,
  LoginCredentials,
} from "../../domain/auth";
import {
  AccountExistsWithDifferentCredentialError,
  AuthError,
  AuthPopupClosedError,
  InvalidCredentialsError,
  NetworkAuthError,
  SessionExpiredError,
  UnexpectedAuthError,
  UserDisabledError,
} from "../../domain/auth";

export interface FirebaseAuthAdapterDependencies {
  authInstance?: Auth;
  providers?: Record<AuthProviderType, AuthProvider>;
}

const mapFirebaseUser = (user: FirebaseUser | null): IdentityUser | null => {
  if (!user) return null;
  return {
    uid: user.uid,
    email: user.email,
    displayName: user.displayName,
    photoURL: user.photoURL,
  };
};

export const mapFirebaseErrorToDomainError = (error: unknown): AuthError => {
  if (error instanceof AuthError) {
    return error;
  }

  const code = (error as { code?: string })?.code;

  switch (code) {
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
    case "auth/invalid-email":
      return new InvalidCredentialsError("El correo o la contraseña no son válidos.");
    case "auth/user-disabled":
      return new UserDisabledError("Esta cuenta ha sido deshabilitada.");
    case "auth/popup-closed-by-user":
      return new AuthPopupClosedError("El inicio de sesión fue cancelado por el usuario.");
    case "auth/account-exists-with-different-credential":
      return new AccountExistsWithDifferentCredentialError(
        "Ya existe una cuenta con otro proveedor de autenticación para este correo."
      );
    case "auth/network-request-failed":
      return new NetworkAuthError(
        "Error de conexión con el proveedor de autenticación. Verifica tu conexión a internet."
      );
    default:
      return new UnexpectedAuthError(
        "No fue posible completar la autenticación con el proveedor.",
        error
      );
  }
};

export class FirebaseAuthAdapter implements IAuthIdentityProvider {
  private readonly firebaseAuth: Auth;
  private readonly providers: Record<AuthProviderType, AuthProvider>;

  constructor(dependencies: FirebaseAuthAdapterDependencies = {}) {
    this.firebaseAuth = dependencies.authInstance || auth;
    this.providers = dependencies.providers || authProviders;
  }

  getCurrentUser(): IdentityUser | null {
    return mapFirebaseUser(this.firebaseAuth.currentUser);
  }

  async getIdToken(forceRefresh = false): Promise<string> {
    const user = this.firebaseAuth.currentUser;
    if (!user) {
      throw new SessionExpiredError("No hay un usuario de Firebase activo para obtener el token.");
    }

    try {
      return await user.getIdToken(forceRefresh);
    } catch (error) {
      throw mapFirebaseErrorToDomainError(error);
    }
  }

  onAuthStateChanged(callback: (user: IdentityUser | null) => void): () => void {
    return onAuthStateChanged(this.firebaseAuth, (firebaseUser) => {
      callback(mapFirebaseUser(firebaseUser));
    });
  }

  async loginWithEmailPassword(credentials: LoginCredentials): Promise<IdentityProviderResult> {
    try {
      const userCredential = await signInWithEmailAndPassword(
        this.firebaseAuth,
        credentials.email,
        credentials.password
      );

      const idToken = await userCredential.user.getIdToken();
      const identityUser = mapFirebaseUser(userCredential.user);

      if (!identityUser) {
        throw new UnexpectedAuthError("No se pudo obtener el usuario autenticado.");
      }

      return {
        user: identityUser,
        idToken,
      };
    } catch (error) {
      throw mapFirebaseErrorToDomainError(error);
    }
  }

  async loginWithProvider(provider: AuthProviderType): Promise<IdentityProviderResult> {
    const authProvider = this.providers[provider];

    if (!authProvider) {
      throw new UnexpectedAuthError(
        `El proveedor "${provider}" no se encuentra configurado.`
      );
    }

    try {
      const userCredential = await signInWithPopup(this.firebaseAuth, authProvider);
      const idToken = await userCredential.user.getIdToken();
      const identityUser = mapFirebaseUser(userCredential.user);

      if (!identityUser) {
        throw new UnexpectedAuthError("No se pudo obtener el usuario autenticado.");
      }

      return {
        user: identityUser,
        idToken,
      };
    } catch (error) {
      throw mapFirebaseErrorToDomainError(error);
    }
  }

  async logout(): Promise<void> {
    try {
      await signOut(this.firebaseAuth);
    } catch (error) {
      throw mapFirebaseErrorToDomainError(error);
    }
  }
}

export const defaultFirebaseAuthAdapter = new FirebaseAuthAdapter();
export default defaultFirebaseAuthAdapter;

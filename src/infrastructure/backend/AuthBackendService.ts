import type { AxiosError, AxiosInstance } from "axios";
import type {
  AppProfile,
  AppRole,
  AppUser,
  AuthSessionResponseDTO,
  IAuthBackendService,
} from "../../domain/auth";
import {
  InvalidServerResponseError,
  NetworkAuthError,
  ServerAuthenticationError,
  SessionExpiredError,
  UnexpectedAuthError,
} from "../../domain/auth";
import apiClient from "../../interceptors/apiClient";

export interface AuthBackendEndpoints {
  authEndpoint?: string;
  sessionEndpoint?: string;
  logoutEndpoint?: string;
}

const VALID_ROLES: AppRole[] = ["TEACHER", "STUDENT", "ADMIN"];

const isValidAppRole = (role: unknown): role is AppRole => {
  return typeof role === "string" && VALID_ROLES.includes(role as AppRole);
};

export const validateAndTransformSessionDTO = (data: unknown): AuthSessionResponseDTO => {
  if (!data || typeof data !== "object") {
    throw new InvalidServerResponseError("La respuesta del backend está vacía o no es un objeto.");
  }

  const raw = data as Record<string, unknown>;
  const rawUser = raw.user as Record<string, unknown> | undefined;

  if (!rawUser || typeof rawUser !== "object") {
    throw new InvalidServerResponseError("La respuesta del backend no contiene el objeto 'user'.");
  }

  if (typeof rawUser.id !== "string" || !rawUser.id.trim()) {
    throw new InvalidServerResponseError("El usuario retornado por el backend no contiene un 'id' válido.");
  }

  if (typeof rawUser.email !== "string") {
    throw new InvalidServerResponseError("El usuario retornado por el backend no contiene un 'email' válido.");
  }

  if (!isValidAppRole(rawUser.role)) {
    throw new InvalidServerResponseError(
      `El rol "${String(rawUser.role)}" proporcionado por el backend no es válido. Roles válidos: ${VALID_ROLES.join(", ")}`
    );
  }

  let profile: AppProfile | undefined = undefined;
  if (rawUser.profile && typeof rawUser.profile === "object") {
    const rawProfile = rawUser.profile as Record<string, unknown>;
    profile = {
      id: String(rawProfile.id || rawUser.id),
      first_name: String(rawProfile.first_name || ""),
      last_name: String(rawProfile.last_name || ""),
      phone: typeof rawProfile.phone === "string" ? rawProfile.phone : undefined,
      identification:
        typeof rawProfile.identification === "string"
          ? rawProfile.identification
          : undefined,
    };
  }

  const user: AppUser = {
    id: rawUser.id,
    email: rawUser.email,
    role: rawUser.role,
    code: typeof rawUser.code === "string" ? rawUser.code : undefined,
    profile,
  };

  return {
    user,
    token: typeof raw.token === "string" ? raw.token : undefined,
    message: typeof raw.message === "string" ? raw.message : undefined,
  };
};

export class AuthBackendService implements IAuthBackendService {
  private readonly client: AxiosInstance;
  private readonly authEndpoint: string;
  private readonly sessionEndpoint: string;
  private readonly logoutEndpoint: string;

  constructor(client: AxiosInstance = apiClient, endpoints: AuthBackendEndpoints = {}) {
    this.client = client;
    this.authEndpoint =
      endpoints.authEndpoint ||
      import.meta.env.VITE_AUTH_ENDPOINT ||
      "/auth/firebase";
    this.sessionEndpoint =
      endpoints.sessionEndpoint ||
      import.meta.env.VITE_SESSION_ENDPOINT ||
      "/auth/session";
    this.logoutEndpoint =
      endpoints.logoutEndpoint ||
      import.meta.env.VITE_LOGOUT_ENDPOINT ||
      "/auth/logout";
  }

  async loginWithIdToken(idToken: string): Promise<AuthSessionResponseDTO> {
    try {
      const response = await this.client.post<unknown>(
        this.authEndpoint,
        { idToken },
        {
          headers: {
            Authorization: `Bearer ${idToken}`,
          },
        }
      );

      return validateAndTransformSessionDTO(response.data);
    } catch (error) {
      this.handleHttpError(error, "Fallo al verificar el token con el servidor backend.");
    }
  }

  async getCurrentSession(): Promise<AuthSessionResponseDTO> {
    try {
      const response = await this.client.get<unknown>(this.sessionEndpoint);
      return validateAndTransformSessionDTO(response.data);
    } catch (error) {
      this.handleHttpError(error, "Fallo al verificar la sesión activa con el backend.");
    }
  }

  async logout(): Promise<void> {
    try {
      await this.client.post(this.logoutEndpoint);
    } catch (error) {
      // Registrar de forma segura sin exponer tokens y propagar si necesario
      const axiosError = error as AxiosError;
      if (!axiosError.response) {
        throw new NetworkAuthError("No se pudo contactar al servidor para invalidar la sesión.");
      }
    }
  }

  private handleHttpError(error: unknown, defaultMessage: string): never {
    const axiosError = error as AxiosError<{ message?: string }>;

    if (!axiosError.isAxiosError) {
      if (error instanceof Error) {
        throw error;
      }
      throw new UnexpectedAuthError(defaultMessage, error);
    }

    if (!axiosError.response) {
      throw new NetworkAuthError(
        "No se pudo conectar con el servidor backend. Verifica tu conexión de red."
      );
    }

    const status = axiosError.response.status;
    const backendMessage = axiosError.response.data?.message;

    if (status === 401) {
      throw new SessionExpiredError(
        backendMessage || "La sesión no es válida o ha expirado en el servidor."
      );
    }

    if (status === 403) {
      throw new ServerAuthenticationError(
        backendMessage || "El servidor rechazó las credenciales o el token no es válido.",
        status
      );
    }

    throw new ServerAuthenticationError(
      backendMessage || `${defaultMessage} Código de estado: ${status}`,
      status
    );
  }
}

export const defaultAuthBackendService = new AuthBackendService();
export default defaultAuthBackendService;

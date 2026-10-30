import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { SessionStrategyType } from "../domain/auth/contracts";

export type TokenProvider = () => Promise<string | null>;
export type UnauthorizedHandler = () => void;

export interface CreateApiClientOptions {
  baseURL?: string;
  strategy?: SessionStrategyType;
  timeoutMs?: number;
}

const resolveBaseURL = (): string => {
  const envBaseUrl =
    import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL;
  const baseURL = envBaseUrl || "http://localhost:8181";

  return baseURL.replace(/\/api\/?$/i, "").replace(/\/+$/, "");
};

/**
 * Cliente HTTP centralizado para comunicación con el backend (Spring Boot u otros).
 *
 * - Usa JWT Bearer por defecto y no depende de cookies de sesión.
 * - El interceptor de 401 evita bucles de reintentos infinitos y no cierra la sesión
 *   indiscriminadamente ante errores que no correspondan a sesiones expiradas en endpoints protegidos.
 */
export class ApiHttpClient {
  readonly instance: AxiosInstance;
  private tokenProvider: TokenProvider | null = null;
  private unauthorizedHandler: UnauthorizedHandler | null = null;
  private isHandlingUnauthorized = false;
  private currentStrategy: SessionStrategyType;

  constructor(options: CreateApiClientOptions = {}) {
    this.currentStrategy = options.strategy || "bearer";

    this.instance = axios.create({
      baseURL: options.baseURL || resolveBaseURL(),
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: false,
      timeout: options.timeoutMs ?? 15000,
    });

    this.setupInterceptors();
  }

  get strategy(): SessionStrategyType {
    return this.currentStrategy;
  }

  setStrategy(strategy: SessionStrategyType): void {
    this.currentStrategy = strategy;
  }

  setTokenProvider(provider: TokenProvider | null): void {
    this.tokenProvider = provider;
  }

  registerUnauthorizedHandler(handler: UnauthorizedHandler): () => void {
    this.unauthorizedHandler = handler;

    return () => {
      if (this.unauthorizedHandler === handler) {
        this.unauthorizedHandler = null;
      }
    };
  }

  private setupInterceptors(): void {
    // Interceptor de Request: solo adjunta Bearer token si la estrategia configurada es "bearer"
    this.instance.interceptors.request.use(
      async (config: InternalAxiosRequestConfig) => {
        const isAuthRequest =
          config.url?.includes("/auth/login") ||
          config.url?.includes("/auth/register") ||
          config.url?.includes("/auth/oauth");

        if (
          this.currentStrategy === "bearer" &&
          !isAuthRequest &&
          this.tokenProvider
        ) {
          const token = await this.tokenProvider();
          if (token) {
            config.headers.set("Authorization", `Bearer ${token}`);
          }
        }

        return config;
      },
      (error: unknown) => Promise.reject(error)
    );

    // Interceptor de Response: Manejo de 401 protegido sin bucles de reintentos
    this.instance.interceptors.response.use(
      (response) => response,
      (error: AxiosError) => {
        const requestUrl = error.config?.url || "";

        // Ignorar endpoints de autenticación y verificación de sesión para no cerrar sesiones
        // indiscriminadamente ni generar ciclos de redirección/logout.
        const isAuthEndpoint =
          requestUrl.includes("/auth/") ||
          requestUrl.includes("/session") ||
          requestUrl.includes("/logout");

        // Solo notificar expiración si es un 401 confirmado en un endpoint de negocio protegido
        if (
          error.response?.status === 401 &&
          !isAuthEndpoint &&
          !this.isHandlingUnauthorized &&
          this.unauthorizedHandler
        ) {
          this.isHandlingUnauthorized = true;
          this.unauthorizedHandler();

          queueMicrotask(() => {
            this.isHandlingUnauthorized = false;
          });
        }

        // Se propaga el error sin forzar bucles automáticos de reintentos
        return Promise.reject(error);
      }
    );
  }
}

export const defaultApiClient = new ApiHttpClient();
export const apiClient = defaultApiClient.instance;

export const registerUnauthorizedHandler = (
  handler: UnauthorizedHandler
): (() => void) => {
  return defaultApiClient.registerUnauthorizedHandler(handler);
};

export const setTokenProvider = (provider: TokenProvider | null): void => {
  defaultApiClient.setTokenProvider(provider);
};

export default apiClient;

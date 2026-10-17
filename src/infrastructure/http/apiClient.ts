import axios, {
  type AxiosError,
  type AxiosInstance,
  type InternalAxiosRequestConfig,
} from "axios";
import type { SessionStrategyType } from "../../domain/auth/contracts";

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

  return envBaseUrl || "http://localhost:8080";
};

const resolveStrategy = (): SessionStrategyType => {
  const strategyEnv = import.meta.env.VITE_AUTH_STRATEGY?.toLowerCase();
  return strategyEnv === "bearer" ? "bearer" : "cookie";
};

/**
 * Cliente HTTP centralizado para comunicación con el backend (Spring Boot u otros).
 *
 * - Por defecto utiliza la estrategia 'cookie' (HttpOnly Cookie): no adjunta tokens Bearer
 *   en las peticiones de negocio; el navegador gestiona automáticamente las cookies de sesión
 *   mediante `withCredentials: true`.
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
    this.currentStrategy = options.strategy || resolveStrategy();

    this.instance = axios.create({
      baseURL: options.baseURL || resolveBaseURL(),
      headers: {
        "Content-Type": "application/json",
      },
      withCredentials: true,
      withXSRFToken: true,
      xsrfCookieName: "XSRF-TOKEN",
      xsrfHeaderName: "X-XSRF-TOKEN",
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
          config.url?.includes("/auth/") ||
          config.url?.includes("/session") ||
          false;

        // Si la estrategia es "cookie" (Alternativa A - Spring Boot), NO se inyecta token Bearer.
        // El Firebase ID token solo se envía expresamente durante el inicio de sesión.
        if (
          this.currentStrategy === "bearer" &&
          !isAuthRequest &&
          this.tokenProvider
        ) {
          try {
            const token = await this.tokenProvider();
            if (token) {
              config.headers.set("Authorization", `Bearer ${token}`);
            }
          } catch {
            // Continúa sin token para que el backend determine si la ruta es pública o protegida
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

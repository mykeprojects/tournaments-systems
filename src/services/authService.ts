import axios from "axios";
import apiClient from "../interceptors/apiClient";
import type { RegisterUserRequest } from "../models/auth/RegisterUserRequest";
import type { RegisteredUser } from "../models/auth/RegisteredUser";
import type {
  AuthSessionResponse,
  CredentialLoginResponse,
  TwoFactorStatus,
} from "../models/auth";
import type { AuthProviderType } from "../domain/auth";

export const register = async (
  request: RegisterUserRequest
): Promise<RegisteredUser> => {
  try {
    const response = await apiClient.post<RegisteredUser>(
      "/api/auth/register",
      request
    );
    return response.data;
  } catch (error) {
    throw new Error(getRegistrationErrorMessage(error));
  }
};

export const login = async (
  email: string,
  password: string
): Promise<CredentialLoginResponse> => {
  try {
    const response = await apiClient.post<CredentialLoginResponse>("/api/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const verifyTwoFactor = async (
  challengeToken: string,
  code: string
): Promise<AuthSessionResponse> => {
  try {
    const response = await apiClient.post<AuthSessionResponse>("/api/auth/2fa/verify", {
      challengeToken,
      code,
    });
    return response.data;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const getTwoFactorStatus = async (): Promise<TwoFactorStatus> => {
  const response = await apiClient.get<TwoFactorStatus>("/api/auth/2fa");
  return response.data;
};

export const updateTwoFactorPreference = async (
  enabled: boolean
): Promise<TwoFactorStatus> => {
  const response = await apiClient.put<TwoFactorStatus>("/api/auth/2fa", {
    enabled,
  });
  return response.data;
};

export const loginWithExternalProvider = async (
  _provider: AuthProviderType,
  idToken: string
): Promise<AuthSessionResponse> => {
  try {
    const response = await apiClient.post<AuthSessionResponse>("/api/auth/oauth", {
      provider: "firebase",
      idToken,
    });
    return response.data;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
};

export const logout = async (): Promise<void> => {
  await apiClient.post("/api/auth/logout");
};

const getAuthErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;

    if (typeof message === "string" && message.trim()) {
      return message;
    }

    if (error.response?.status === 401) {
      return "Correo o contraseña incorrectos.";
    }

    if (!error.response) {
      return "No se pudo conectar con el backend. Verifica que esté activo en localhost:8181.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible iniciar sesión.";
};

const getRegistrationErrorMessage = (error: unknown): string => {
  if (axios.isAxiosError<Record<string, unknown>>(error)) {
    const data = error.response?.data;
    if (data && typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    if (data && typeof data === "object") {
      const validationErrors = Object.entries(data)
        .filter(([, value]) => typeof value === "string")
        .map(([field, value]) => `${field}: ${value}`);
      if (validationErrors.length > 0) {
        return validationErrors.join(" ");
      }
    }

    if (!error.response) {
      return "No se pudo conectar con el backend. Verifica que esté activo en localhost:8181.";
    }
  }

  if (error instanceof Error) {
    return error.message;
  }

  return "No fue posible crear la cuenta.";
};

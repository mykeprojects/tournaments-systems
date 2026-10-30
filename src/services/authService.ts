import axios from "axios";
import apiClient from "../interceptors/apiClient";
import { getUserRoleAssignments, getUserWithRoles } from "./userService";
import type { RegisterUserRequest } from "../models/auth/RegisterUserRequest";
import type { RegisteredUser } from "../models/auth/RegisteredUser";
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

export interface AuthSessionResponse {
  accessToken: string;
  tokenType: string;
  expiresAt: string;
}

export const login = async (
  email: string,
  password: string
): Promise<AuthSessionResponse> => {
  try {
    const response = await apiClient.post<AuthSessionResponse>("/api/auth/login", {
      email,
      password,
    });

    return response.data;
  } catch (error) {
    throw new Error(getAuthErrorMessage(error));
  }
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

export const getUserIdFromToken = (token: string): number => {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("El token recibido no tiene un formato JWT válido.");
  }

  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decodedPayload = JSON.parse(atob(base64)) as { sub?: unknown };
    const userId =
      typeof decodedPayload.sub === "string"
        ? Number.parseInt(decodedPayload.sub, 10)
        : Number.NaN;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error("El token no contiene un identificador de usuario válido.");
    }

    return userId;
  } catch (error) {
    if (error instanceof Error && error.message.includes("identificador")) {
      throw error;
    }
    throw new Error("No fue posible leer el usuario del token recibido.");
  }
};

export const isUserAdmin = async (userId: number): Promise<boolean> => {
  try {
    const user = await getUserWithRoles(userId);
    return user.roles.some((assignment) => assignment.role?.name === "ADMIN");
  } catch (error) {
    if (!axios.isAxiosError(error) || error.response?.status !== 403) {
      throw error;
    }

    try {
      const assignments = await getUserRoleAssignments(userId);
      return assignments.some((assignment) => assignment.role?.name === "ADMIN");
    } catch (fallbackError) {
      if (axios.isAxiosError(fallbackError) && fallbackError.response?.status === 403) {
        throw new Error(
          "El backend rechazó las dos consultas de roles. Debe permitir detail-with-roles o user-roles/users/{userId} para que el frontend determine si eres admin."
        );
      }

      throw fallbackError;
    }
  }
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

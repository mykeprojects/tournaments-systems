import axios from "axios";
import apiClient from "../interceptors/apiClient";
import type { PasswordRecoveryRequest } from "../models/auth/PasswordRecoveryRequest";
import type { PasswordRecoveryVerificationRequest } from "../models/auth/PasswordRecoveryVerificationRequest";
import type { PasswordRecoveryVerificationResponse } from "../models/auth/PasswordRecoveryVerificationResponse";
import type { PasswordResetRequest } from "../models/auth/PasswordResetRequest";

const getErrorMessage = (error: unknown, fallback: string): string => {
  if (axios.isAxiosError<{ message?: unknown }>(error)) {
    const message = error.response?.data?.message;
    if (typeof message === "string" && message.trim()) {
      return message;
    }
    if (!error.response) {
      return "No se pudo conectar con el backend. Intenta nuevamente.";
    }
  }
  return error instanceof Error ? error.message : fallback;
};

export const requestPasswordRecovery = async (
  request: PasswordRecoveryRequest
): Promise<void> => {
  try {
    await apiClient.post("/api/auth/password-recovery/request", request);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "No fue posible solicitar la recuperación.")
    );
  }
};

export const verifyPasswordRecovery = async (
  request: PasswordRecoveryVerificationRequest
): Promise<PasswordRecoveryVerificationResponse> => {
  try {
    const response = await apiClient.post<PasswordRecoveryVerificationResponse>(
      "/api/auth/password-recovery/verify",
      request
    );
    return response.data;
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "El código no es válido o ha expirado.")
    );
  }
};

export const resetPassword = async (
  request: PasswordResetRequest
): Promise<void> => {
  try {
    await apiClient.post("/api/auth/password-recovery/reset", request);
  } catch (error) {
    throw new Error(
      getErrorMessage(error, "No fue posible cambiar la contraseña.")
    );
  }
};

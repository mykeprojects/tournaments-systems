import axios from "axios";
import apiClient from "../interceptors/apiClient";

export interface UserSummary {
  id: number;
  name: string;
  email: string;
}

export interface CreateUserRequest {
  name: string;
  email: string;
  password: string;
}

export interface UserWithRoles extends UserSummary {
  roles: UserRoleAssignment[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
}

export interface UserRoleAssignment {
  id: number;
  userId: number;
  role: Role;
}

export interface CreateUserRoleRequest {
  userId: number;
  roleId: number;
}

export interface Profile {
  id: number;
  userId: number;
  phone: string;
  photoUrl: string | null;
  birthDate: string;
}

export interface UserDetail extends UserSummary {
  profile: Profile | null;
}

export const listUsers = async (): Promise<UserSummary[]> => {
  const response = await apiClient.get<UserSummary[]>("/api/users");
  return response.data;
};

export const getUserWithRoles = async (userId: number): Promise<UserWithRoles> => {
  const response = await apiClient.get<UserWithRoles>(
    `/api/users/${userId}/detail-with-roles`
  );
  return response.data;
};

export const getUserRoleAssignments = async (
  userId: number
): Promise<UserRoleAssignment[]> => {
  const response = await apiClient.get<UserRoleAssignment[]>(
    `/api/user-roles/users/${userId}`
  );
  return response.data;
};

export const listRoles = async (): Promise<Role[]> => {
  const response = await apiClient.get<Role[]>("/api/roles");
  return response.data;
};

export const listUserRoleAssignments = async (): Promise<UserRoleAssignment[]> => {
  const response = await apiClient.get<UserRoleAssignment[]>("/api/user-roles");
  return response.data;
};

export const createUserRole = async (
  assignment: CreateUserRoleRequest
): Promise<UserRoleAssignment> => {
  const response = await apiClient.post<UserRoleAssignment>(
    "/api/user-roles",
    assignment
  );
  return response.data;
};

export const getUserDetail = async (userId: number): Promise<UserDetail> => {
  const response = await apiClient.get<UserDetail>(`/api/users/${userId}/detail`);
  return response.data;
};

export const getProfile = async (userId: number): Promise<Profile> => {
  const response = await apiClient.get<Profile>(`/api/users/${userId}/profile`);
  return response.data;
};

export const createProfile = async (
  userId: number,
  profile: Omit<Profile, "id" | "userId">
): Promise<Profile> => {
  const response = await apiClient.post<Profile>(
    `/api/users/${userId}/profile`,
    profile
  );
  return response.data;
};

export const updateProfile = async (
  userId: number,
  profile: Omit<Profile, "id" | "userId">
): Promise<Profile> => {
  const response = await apiClient.put<Profile>(
    `/api/users/${userId}/profile`,
    profile
  );
  return response.data;
};

export const deleteProfile = async (userId: number): Promise<void> => {
  await apiClient.delete(`/api/users/${userId}/profile`);
};

export const createUser = async (
  user: CreateUserRequest
): Promise<UserSummary> => {
  const response = await apiClient.post<UserSummary>("/api/users", user);
  return response.data;
};

export const deleteUser = async (userId: number): Promise<void> => {
  await apiClient.delete(`/api/users/${userId}`);
};

export const isUserServiceNotFoundError = (error: unknown): boolean =>
  axios.isAxiosError(error) && error.response?.status === 404;

export const getUserServiceErrorMessage = (
  error: unknown,
  fallback: string
): string => {
  if (!axios.isAxiosError<unknown>(error)) {
    return error instanceof Error ? error.message : fallback;
  }

  const responseData = error.response?.data;

  if (responseData && typeof responseData === "object") {
    const data = responseData as Record<string, unknown>;

    if (typeof data.message === "string" && data.message.trim()) {
      return data.message;
    }

    const fieldErrors = Object.entries(data)
      .filter(([, value]) => typeof value === "string" || Array.isArray(value))
      .map(([field, value]) => {
        const messages = Array.isArray(value) ? value.join(", ") : value;
        return `${field}: ${String(messages)}`;
      });

    if (fieldErrors.length > 0) {
      return fieldErrors.join(" ");
    }
  }

  if (error.response?.status === 401) {
    return "La sesión expiró. Inicia sesión nuevamente.";
  }

  if (error.response?.status === 403) {
    return "Tu usuario no tiene permisos para gestionar usuarios.";
  }

  if (!error.response) {
    return "No se pudo conectar con el backend. Verifica que esté activo en localhost:8181.";
  }

  return fallback;
};

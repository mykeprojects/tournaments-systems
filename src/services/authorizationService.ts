import apiClient from "../interceptors/apiClient";
import type { Permission } from "../models/authorization";

export const listCurrentUserPermissions = async (
  userId: number
): Promise<Permission[]> => {
  const response = await apiClient.get<Permission[]>(
    `/api/users/${userId}/permissions`
  );
  return response.data;
};

import type { Role } from "./Role";

export interface UserRoleAssignment {
  id: number;
  userId: number;
  role: Role;
}

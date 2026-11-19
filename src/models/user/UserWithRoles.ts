import type { UserRoleAssignment } from "./UserRoleAssignment";
import type { UserSummary } from "./UserSummary";

export interface UserWithRoles extends UserSummary {
  roles: UserRoleAssignment[];
}

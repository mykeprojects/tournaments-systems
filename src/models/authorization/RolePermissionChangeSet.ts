import type { RolePermissionAssignment } from "./RolePermissionAssignment";

export interface RolePermissionChangeSet {
  additions: number[];
  removals: RolePermissionAssignment[];
}

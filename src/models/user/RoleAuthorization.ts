import type { PermissionAuthorization } from "../authorization/PermissionAuthorization";
import type { Role } from "./Role";

export interface RoleAuthorization extends Role {
  permissions: PermissionAuthorization[];
}

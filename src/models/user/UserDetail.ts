import type { Profile } from "./Profile";
import type { RoleAuthorization } from "./RoleAuthorization";
import type { UserSummary } from "./UserSummary";

export interface UserDetail extends UserSummary {
  profile: Profile | null;
  roles?: RoleAuthorization[];
}

import type { IconName } from "../icons/Icon";

const RESOURCE_ICONS: Record<string, IconName> = {
  users: "user",
  roles: "shield",
  permissions: "key",
  profiles: "idCard",
  "user-roles": "link",
  "role-permissions": "checkbox",
  tournaments: "trophy",
  teams: "users",
  players: "ball",
  matches: "calendar",
  tickets: "ticket",
  venues: "stadium",
  reports: "chart",
};

export const iconForResource = (resourceKey: string): IconName =>
  RESOURCE_ICONS[resourceKey] ?? "cube";

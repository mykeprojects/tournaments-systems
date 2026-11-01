export type PermissionAction =
  | "Ver"
  | "Listar"
  | "Crear"
  | "Actualizar"
  | "Eliminar";

export const permissionAction = (
  method: string,
  url: string
): PermissionAction | string => {
  const normalized = method.trim().toUpperCase();

  if (normalized === "POST") {
    return "Crear";
  }
  if (normalized === "PUT" || normalized === "PATCH") {
    return "Actualizar";
  }
  if (normalized === "DELETE") {
    return "Eliminar";
  }
  if (normalized === "GET") {
    return /\{id\}|\/detail(?:\/|$)/i.test(url) ? "Ver" : "Listar";
  }

  return method;
};

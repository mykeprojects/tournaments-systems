import { MATRIX_ACTIONS, type PermissionAction } from "./permissionMatrix";

export const PERMISSION_HTTP_METHODS = [
  "GET",
  "POST",
  "PUT",
  "PATCH",
  "DELETE",
] as const;

export type PermissionHttpMethod = (typeof PERMISSION_HTTP_METHODS)[number];

export type PermissionDraft = {
  method: PermissionHttpMethod;
  url: string;
  model: string;
};

export const SUGGESTED_PERMISSION_MODELS = [
  "users",
  "roles",
  "permissions",
  "profiles",
  "user-roles",
  "role-permissions",
  "tournaments",
  "teams",
  "players",
  "matches",
  "tickets",
  "venues",
  "reports",
] as const;

export const normalizePermissionBaseUrl = (url: string): string => {
  const trimmed = url.trim();
  if (trimmed.length > 1 && trimmed.endsWith("/")) {
    return trimmed.slice(0, -1);
  }
  return trimmed;
};

export const defaultBaseUrlForModel = (model: string): string => {
  const slug = model.trim().toLocaleLowerCase().replace(/\s+/g, "-");
  return slug ? `/api/${slug}` : "/api/";
};

const draftByAction = (
  model: string,
  baseUrl: string
): Record<PermissionAction, PermissionDraft> => {
  const itemUrl = `${baseUrl}/{id}`;
  return {
    Listar: { method: "GET", url: baseUrl, model },
    Ver: { method: "GET", url: itemUrl, model },
    Crear: { method: "POST", url: baseUrl, model },
    Actualizar: { method: "PUT", url: itemUrl, model },
    Eliminar: { method: "DELETE", url: itemUrl, model },
  };
};

export const permissionDraftsForResource = (
  model: string,
  baseUrl: string,
  actions: PermissionAction[]
): PermissionDraft[] => {
  const normalizedModel = model.trim();
  const root = normalizePermissionBaseUrl(baseUrl);
  const drafts = draftByAction(normalizedModel, root);
  const selected = new Set(actions);

  return MATRIX_ACTIONS.filter((action) => selected.has(action)).map(
    (action) => drafts[action]
  );
};

export const validateCreatePermission = (input: {
  url: string;
  method: string;
  model: string;
}): string | null => {
  const method = input.method.trim().toUpperCase();
  const url = input.url.trim();
  const model = input.model.trim();

  if (!method) {
    return "El método HTTP es obligatorio.";
  }
  if (!PERMISSION_HTTP_METHODS.includes(method as PermissionHttpMethod)) {
    return "El método HTTP no es válido.";
  }
  if (!url) {
    return "La URL es obligatoria.";
  }
  if (!url.startsWith("/")) {
    return "La URL debe iniciar con /.";
  }
  if (url.length > 255) {
    return "La URL no puede superar 255 caracteres.";
  }
  if (!model) {
    return "El modelo o recurso es obligatorio.";
  }
  if (model.length > 100) {
    return "El modelo no puede superar 100 caracteres.";
  }
  return null;
};

export const validateCreateResourcePermissions = (input: {
  model: string;
  baseUrl: string;
  actions: PermissionAction[];
}): string | null => {
  const model = input.model.trim();
  const baseUrl = normalizePermissionBaseUrl(input.baseUrl);

  if (!model) {
    return "El modelo o recurso es obligatorio.";
  }
  if (model.length > 100) {
    return "El modelo no puede superar 100 caracteres.";
  }
  if (!baseUrl) {
    return "La URL del recurso es obligatoria.";
  }
  if (!baseUrl.startsWith("/")) {
    return "La URL debe iniciar con /.";
  }
  if (baseUrl === "/api") {
    return "Indica la URL completa del recurso, por ejemplo /api/pizzas.";
  }
  if (input.actions.length === 0) {
    return "Selecciona al menos una operación (Ver, Listar, Crear, Actualizar o Eliminar).";
  }

  for (const draft of permissionDraftsForResource(
    model,
    baseUrl,
    input.actions
  )) {
    const draftError = validateCreatePermission(draft);
    if (draftError) {
      return draftError;
    }
  }
  return null;
};

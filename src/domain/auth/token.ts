export const getUserIdFromToken = (token: string): number => {
  const payload = token.split(".")[1];

  if (!payload) {
    throw new Error("El token recibido no tiene un formato JWT válido.");
  }

  try {
    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/")
      .padEnd(Math.ceil(payload.length / 4) * 4, "=");
    const decodedPayload = JSON.parse(atob(base64)) as { sub?: unknown };
    const userId =
      typeof decodedPayload.sub === "string"
        ? Number.parseInt(decodedPayload.sub, 10)
        : Number.NaN;

    if (!Number.isSafeInteger(userId) || userId <= 0) {
      throw new Error("El token no contiene un identificador de usuario válido.");
    }

    return userId;
  } catch (error) {
    if (error instanceof Error && error.message.includes("identificador")) {
      throw error;
    }
    throw new Error("No fue posible leer el usuario del token recibido.");
  }
};

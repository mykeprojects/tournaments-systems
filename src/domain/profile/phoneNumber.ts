export const PHONE_DIGIT_COUNT = 10;

export const sanitizePhoneNumber = (value: string): string =>
  value.replace(/\D/g, "").slice(0, PHONE_DIGIT_COUNT);

export const isValidPhoneNumber = (value: string): boolean =>
  new RegExp(`^\\d{${PHONE_DIGIT_COUNT}}$`).test(value);

export const PHONE_NUMBER_MESSAGE =
  "El teléfono debe tener exactamente 10 dígitos numéricos.";

export type PaymentMethodType =
  | "CARD"
  | "BANK_ACCOUNT"
  | "DIGITAL_WALLET"
  | "OTHER";

export interface PaymentMethodCatalog {
  id: number;
  name: string;
  description: string;
  type: PaymentMethodType;
  is_active: boolean;
}

export interface FanPaymentMethod {
  id: number;
  fanId: number;
  paymentMethodName: string;
  maskedReference: string;
  holderName: string | null;
  isActive: boolean;
}

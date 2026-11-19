export interface FanPaymentMethod {
  id: number;
  fanId: number;
  paymentMethodId: number;
  paymentMethodName: string;
  maskedReference: string;
  holderName: string | null;
  isActive: boolean;
}

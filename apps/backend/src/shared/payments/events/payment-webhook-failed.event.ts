export const PAYMENT_WEBHOOK_FAILED_EVENT_TYPE =
  'PAYMENT_WEBHOOK.PAYMENT_FAILED' as const;

export class PaymentWebhookFailedEvent {
  static readonly eventType = PAYMENT_WEBHOOK_FAILED_EVENT_TYPE;

  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
  ) {}
}

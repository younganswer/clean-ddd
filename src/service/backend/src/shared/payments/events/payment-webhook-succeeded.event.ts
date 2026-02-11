export const PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE =
  'PAYMENT_WEBHOOK.PAYMENT_SUCCEEDED' as const;

export class PaymentWebhookSucceededEvent {
  static readonly eventType = PAYMENT_WEBHOOK_SUCCEEDED_EVENT_TYPE;

  constructor(
    public readonly orderId: string,
    public readonly paymentId: string,
  ) {}
}

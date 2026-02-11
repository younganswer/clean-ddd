import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxModule } from '../shared/outbox/modules/outbox.module';
import { PaymentsModule } from '../modules/payments/payments.module';
import { OrderingModule } from '../modules/ordering/ordering.module';
import { PaymentWebhookEventHandlers } from './webhooks/payment-webhook.event-handlers';

@Module({
  imports: [CqrsModule, OutboxModule, PaymentsModule, OrderingModule],
  providers: [PaymentWebhookEventHandlers],
})
export class SagaOrchestratorModule {}

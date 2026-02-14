import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import {
  PaymentWebhookFailedHandler,
  PaymentWebhookSucceededHandler,
} from '@/saga-orchestrator/webhooks/payment-webhook.event-handlers';

@Module({
  imports: [CqrsModule, OutboxModule, PaymentsModule, OrderingModule],
  providers: [PaymentWebhookSucceededHandler, PaymentWebhookFailedHandler],
})
export class SagaOrchestratorModule {}

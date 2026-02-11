import { forwardRef, Module } from '@nestjs/common';
import { OrderingModule } from '../ordering/ordering.module';
import { OutboxModule } from '../../shared/outbox/outbox.module';
import { PaymentsWebhookHandler } from './application/payments-webhook.handler';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [OrderingModule, forwardRef(() => OutboxModule)],
  controllers: [PaymentsController],
  providers: [PaymentRepository, PaymentsWebhookHandler],
  exports: [PaymentsWebhookHandler],
})
export class PaymentsModule {}

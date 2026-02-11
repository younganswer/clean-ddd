import { Module } from '@nestjs/common';
import { OrderingModule } from '../ordering/ordering.module';
import { PaymentsWebhookHandler } from './application/payments-webhook.handler';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [OrderingModule],
  controllers: [PaymentsController],
  providers: [PaymentRepository, PaymentsWebhookHandler],
  exports: [PaymentsWebhookHandler],
})
export class PaymentsModule {}

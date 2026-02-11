import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrderingModule } from '../ordering/ordering.module';
import { OutboxModule } from '../../shared/outbox/modules/outbox.module';
import { CreatePaymentIntentHandler } from './application/commands/handlers/create-payment-intent.handler';
import { IPaymentRepositorySymbol } from './domains/repositories/i.payment.repository';
import { PaymentIntentMapper } from './infrastructure/mappers/payment-intent.mapper';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PaymentsController } from './presentation/payments.controller';

@Module({
  imports: [CqrsModule, OrderingModule, forwardRef(() => OutboxModule)],
  controllers: [PaymentsController],
  providers: [
    PaymentIntentMapper,
    PaymentRepository,
    {
      provide: IPaymentRepositorySymbol,
      useExisting: PaymentRepository,
    },
    CreatePaymentIntentHandler,
  ],
  exports: [IPaymentRepositorySymbol],
})
export class PaymentsModule {}

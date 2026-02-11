import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OrderingModule } from '../ordering/ordering.module';
import { OutboxModule } from '../../shared/outbox/modules/outbox.module';
import { CreatePaymentIntentHandler } from './application/commands/handlers/create-payment-intent.handler';
import { GetPaymentIntentHandler } from './application/queries/handlers/get-payment-intent.handler';
import { ListPaymentIntentsHandler } from './application/queries/handlers/list-payment-intents.handler';
import { IPaymentRepositorySymbol } from './domains/repositories/i.payment.repository';
import { PaymentIntentReaderProvider } from './infrastructure/readers/payment-intent.reader';
import { PaymentIntentMapper } from './infrastructure/mappers/payment-intent.mapper';
import { PaymentRepository } from './infrastructure/repositories/payment.repository';
import { PaymentsController } from './presentation/payments.controller';
import { PaymentIntentsController } from './presentation/payment-intents.controller';

@Module({
  imports: [CqrsModule, OrderingModule, forwardRef(() => OutboxModule)],
  controllers: [PaymentsController, PaymentIntentsController],
  providers: [
    PaymentIntentMapper,
    PaymentRepository,
    {
      provide: IPaymentRepositorySymbol,
      useExisting: PaymentRepository,
    },
    PaymentIntentReaderProvider,
    CreatePaymentIntentHandler,
    GetPaymentIntentHandler,
    ListPaymentIntentsHandler,
  ],
  exports: [IPaymentRepositorySymbol],
})
export class PaymentsModule {}

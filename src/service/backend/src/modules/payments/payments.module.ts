import { forwardRef, Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { CreatePaymentIntentHandler } from '@/modules/payments/application/commands/handlers/create-payment-intent.handler';
import { GetPaymentIntentHandler } from '@/modules/payments/application/queries/handlers/get-payment-intent.handler';
import { ListPaymentIntentsHandler } from '@/modules/payments/application/queries/handlers/list-payment-intents.handler';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntentReaderProvider } from '@/modules/payments/infrastructure/readers/payment-intent.reader';
import { PaymentIntentMapper } from '@/modules/payments/infrastructure/mappers/payment-intent.mapper';
import { PaymentRepository } from '@/modules/payments/infrastructure/repositories/payment.repository';
import { PaymentsController } from '@/modules/payments/presentation/payments.controller';
import { PaymentIntentsController } from '@/modules/payments/presentation/payment-intents.controller';
import { OrderPaymentSnapshotReaderProvider } from '@/modules/payments/infrastructure/readers/order-payment-snapshot.reader';

@Module({
	imports: [CqrsModule, forwardRef(() => OutboxModule), OrderingModule],
	controllers: [PaymentsController, PaymentIntentsController],
	providers: [
		PaymentIntentMapper,
		PaymentRepository,
		{
			provide: IPaymentRepositorySymbol,
			useExisting: PaymentRepository,
		},
		PaymentIntentReaderProvider,
		OrderPaymentSnapshotReaderProvider,
		CreatePaymentIntentHandler,
		GetPaymentIntentHandler,
		ListPaymentIntentsHandler,
	],
	exports: [IPaymentRepositorySymbol],
})
export class PaymentsModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderRepositorySymbol } from '@/modules/ordering/domains/repositories/i.order.repository';
import { OrderRepository } from '@/modules/ordering/infrastructure/repositories/order.repository';
import { OrderMapper } from '@/modules/ordering/infrastructure/mappers/order.mapper';
import { CommandHandlers } from '@/modules/ordering/application/commands';
import { QueryHandlers } from '@/modules/ordering/application/queries';
import { AttachPaymentOnPaymentIntentCreatedHandler } from '@/modules/ordering/application/events/handlers/attach-payment-on-payment-intent-created.handler';
import { MarkOrderPaidOnPaymentWebhookSucceededHandler } from '@/modules/ordering/application/events/handlers/mark-order-paid-on-payment-webhook-succeeded.handler';
import { OrdersController } from '@/modules/ordering/presentation/orders.controller';
import { OrderReaderProvider } from '@/modules/ordering/infrastructure/readers/order.reader';
import { IOrderReaderSymbol } from '@/modules/ordering/domains/readers/i.order.reader';

@Module({
	imports: [CqrsModule],
	controllers: [OrdersController],
	providers: [
		OrderMapper,
		OrderRepository,
		{
			provide: IOrderRepositorySymbol,
			useExisting: OrderRepository,
		},
		OrderReaderProvider,
		...CommandHandlers,
		...QueryHandlers,
		AttachPaymentOnPaymentIntentCreatedHandler,
		MarkOrderPaidOnPaymentWebhookSucceededHandler,
	],
	exports: [IOrderReaderSymbol],
})
export class OrderingModule {}

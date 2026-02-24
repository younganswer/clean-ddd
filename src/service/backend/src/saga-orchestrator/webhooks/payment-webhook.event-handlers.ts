import { Inject, Injectable } from '@nestjs/common';
import {
	CommandBus,
	EventsHandler,
	IEventHandler,
	QueryBus,
} from '@nestjs/cqrs';
import { executeCommand, executeQuery } from '@/common/utils/cqrs-executor';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { isOrderView } from '@/shared/ordering/readers/order-view.guard';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import {
	ReserveInventoryForOrderRequestedEvent,
	type InventoryOrderItemPayload,
} from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import { UnitOfWork } from '@/lib/database/unit-of-work';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly payments: IPaymentRepository,
		private readonly uow: UnitOfWork,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly outbox: OutboxProducer,
	) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		await this.uow.transaction(async () => {
			const orderId = String(event.orderId ?? '').trim();
			const paymentId = String(event.paymentId ?? '').trim();
			if (!orderId || !paymentId) {
				throw new Error('invalid webhook payload');
			}

			await this.payments.markSucceeded(paymentId);
			await executeCommand(
				this.commandBus,
				new MarkOrderPaidCommand(orderId),
			);

			const order = await executeQuery(
				this.queryBus,
				new GetOrderQuery(orderId),
			);

			const items: InventoryOrderItemPayload[] =
				isOrderView(order) && order.items.length
					? order.items.map(({ sku, quantity }) => ({
							sku,
							quantity,
						}))
					: [{ sku: 'SKU-001', quantity: 1 }];

			await this.outbox.publish(
				new ReserveInventoryForOrderRequestedEvent(orderId, items),
				{ messageGroupId: orderId },
			);

			await this.outbox.publish(
				new CreateShipmentForOrderRequestedEvent(orderId),
				{ messageGroupId: orderId },
			);
		});
	}
}

@Injectable()
@EventsHandler(PaymentWebhookFailedEvent)
export class PaymentWebhookFailedHandler implements IEventHandler<PaymentWebhookFailedEvent> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly payments: IPaymentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		await this.uow.transaction(async () => {
			const paymentId = String(event.paymentId ?? '').trim();
			if (!paymentId) throw new Error('invalid webhook payload');
			await this.payments.markFailed(paymentId);
		});
	}
}

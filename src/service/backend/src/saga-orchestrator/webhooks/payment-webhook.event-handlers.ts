import { Inject, Injectable } from '@nestjs/common';
import {
	CommandBus,
	EventsHandler,
	IEventHandler,
	QueryBus,
} from '@nestjs/cqrs';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { assertOrderResult } from '@/shared/ordering/readers/order-result.guard';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import {
	ReserveInventoryForOrderRequestedEvent,
	type InventoryOrderItemPayload,
} from '@/shared/inventory';
import { CreateShipmentForOrderRequestedEvent } from '@/shared/shipping';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
		private readonly outboxProducer: OutboxProducer,
	) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		await this.uow.transaction(async () => {
			const { orderId, paymentId } = event;

			const payment = await this.paymentRepository.getById(paymentId);
			payment.markSucceeded();
			await this.paymentRepository.persist(payment);

			const order = await this.queryBus.execute(
				new GetOrderQuery({ orderId }),
			);
			assertOrderResult(order);

			await this.commandBus.execute(
				new MarkOrderPaidCommand({ orderId }),
			);

			const items: InventoryOrderItemPayload[] = order.items.length
				? order.items.map(({ sku, quantity }) => ({
						sku,
						quantity,
					}))
				: [];

			if (!items.length) {
				const template =
					PAYMENTS_APPLICATION_ERRORS.ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION;
				const options = { details: { orderId } };
				throw ApplicationErrorFactory.create(template, options);
			}

			await this.outboxProducer.publish(
				new ReserveInventoryForOrderRequestedEvent({ orderId, items }),
				{ messageGroupId: orderId },
			);

			await this.outboxProducer.publish(
				new CreateShipmentForOrderRequestedEvent({ orderId }),
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
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		await this.uow.transaction(async () => {
			const { paymentId } = event;
			const payment = await this.paymentRepository.getById(paymentId);
			payment.markFailed();
			await this.paymentRepository.persist(payment);
		});
	}
}

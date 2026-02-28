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
import { assertOrderView } from '@/shared/ordering/readers/order-view.guard';
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
			const orderId = String(event.orderId ?? '').trim();
			const paymentId = String(event.paymentId ?? '').trim();
			if (!orderId || !paymentId) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
					{
						details: { orderId, paymentId },
					},
				);
			}

			const payment = await this.paymentRepository.findById(paymentId);
			if (!payment) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_NOT_FOUND,
					{
						details: { paymentId },
					},
				);
			}
			payment.markSucceeded();
			await this.paymentRepository.persist(payment);

			const order = await executeQuery(
				this.queryBus,
				new GetOrderQuery(orderId),
			);
			assertOrderView(order);

			await executeCommand(
				this.commandBus,
				new MarkOrderPaidCommand(orderId),
			);

			const items: InventoryOrderItemPayload[] = order.items.length
				? order.items.map(({ sku, quantity }) => ({
						sku,
						quantity,
					}))
				: [];

			if (!items.length) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.ORDER_ITEMS_REQUIRED_FOR_INVENTORY_RESERVATION,
					{
						details: { orderId },
					},
				);
			}

			await this.outboxProducer.publish(
				new ReserveInventoryForOrderRequestedEvent(orderId, items),
				{ messageGroupId: orderId },
			);

			await this.outboxProducer.publish(
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
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		await this.uow.transaction(async () => {
			const paymentId = String(event.paymentId ?? '').trim();
			if (!paymentId) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_WEBHOOK_PAYLOAD_INVALID,
					{
						details: { paymentId },
					},
				);
			}

			const payment = await this.paymentRepository.findById(paymentId);
			if (!payment) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_NOT_FOUND,
					{
						details: { paymentId },
					},
				);
			}
			payment.markFailed();
			await this.paymentRepository.persist(payment);
		});
	}
}

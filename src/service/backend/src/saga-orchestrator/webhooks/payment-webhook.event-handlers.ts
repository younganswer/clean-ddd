import { Inject, Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import {
	PaymentFulfillmentRequestedEvent,
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { MarkOrderPaidCommand } from '@/shared/ordering/commands/mark-order-paid.command';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { OutboxKnownHandler } from '@/modules/outbox/application/outbox-known-handler.decorator';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
@OutboxKnownHandler(PaymentWebhookSucceededEvent.eventType)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	private readonly logger = new Logger(PaymentWebhookSucceededHandler.name);

	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
		private readonly commandBus: CommandBus,
		private readonly outboxProducer: OutboxProducer,
	) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_succeeded_received',
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		);

		await this.uow.transaction(async () => {
			const { orderId, paymentId } = event;

			const payment = await this.paymentRepository.getById(paymentId);
			payment.markSucceeded();
			await this.paymentRepository.persist(payment);

			await this.commandBus.execute(
				new MarkOrderPaidCommand({ orderId }),
			);

			await this.outboxProducer.publish(
				new PaymentFulfillmentRequestedEvent({ orderId }),
				{ messageGroupId: orderId },
			);

			this.logger.log(
				JSON.stringify({
					step: 'payment_fulfillment_requested_published',
					orderId,
					paymentId,
				}),
			);
		});
	}
}

@Injectable()
@EventsHandler(PaymentWebhookFailedEvent)
@OutboxKnownHandler(PaymentWebhookFailedEvent.eventType)
export class PaymentWebhookFailedHandler implements IEventHandler<PaymentWebhookFailedEvent> {
	private readonly logger = new Logger(PaymentWebhookFailedHandler.name);

	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_failed_received',
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		);

		await this.uow.transaction(async () => {
			const { paymentId } = event;
			const payment = await this.paymentRepository.getById(paymentId);
			payment.markFailed();
			await this.paymentRepository.persist(payment);

			this.logger.log(
				JSON.stringify({
					step: 'payment_marked_failed',
					paymentId,
				}),
			);
		});
	}
}

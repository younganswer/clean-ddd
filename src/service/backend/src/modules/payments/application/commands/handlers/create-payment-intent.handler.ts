import { Inject } from '@nestjs/common';
import {
	CommandBus,
	CommandHandler,
	ICommandHandler,
	QueryBus,
} from '@nestjs/cqrs';
import { executeCommand, executeQuery } from '@/common/utils/cqrs-executor';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import { assertOrderView } from '@/shared/ordering/readers/order-view.guard';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/shared/payments';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { PAYMENTS_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
		private readonly outboxProducer: OutboxProducer,
		private readonly queryBus: QueryBus,
		private readonly commandBus: CommandBus,
	) {}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		return this.uow.transaction(async () => {
			const orderId = String(command.input.orderId ?? '').trim();
			if (!orderId) {
				throw ApplicationErrorFactory.create(
					PAYMENTS_APPLICATION_ERRORS.PAYMENT_ORDER_ID_REQUIRED,
				);
			}

			const order = await executeQuery(
				this.queryBus,
				new GetOrderQuery(orderId),
			);
			assertOrderView(order);

			const payment = PaymentIntent.createPending({
				orderId,
				amount: order.amount,
				currency: order.currency,
			});
			await this.paymentRepository.persist(payment);

			await executeCommand(
				this.commandBus,
				new AttachPaymentToOrderCommand({
					orderId,
					paymentId: payment.id,
				}),
			);

			const outcome = command.input.simulateOutcome ?? 'SUCCEEDED';
			const delaySeconds = Math.max(
				0,
				Number(command.input.simulateDelaySeconds ?? 10),
			);

			const event =
				outcome === 'SUCCEEDED'
					? new PaymentWebhookSucceededEvent(orderId, payment.id)
					: new PaymentWebhookFailedEvent(orderId, payment.id);

			const outboxId = await this.outboxProducer.publish(event, {
				delaySeconds,
				messageGroupId: orderId,
			});

			const eventType =
				outcome === 'SUCCEEDED'
					? PaymentWebhookSucceededEvent.eventType
					: PaymentWebhookFailedEvent.eventType;

			return {
				paymentId: payment.id,
				status: payment.status,
				scheduled: {
					eventType,
					delaySeconds,
					outboxId,
				},
			};
		});
	}
}

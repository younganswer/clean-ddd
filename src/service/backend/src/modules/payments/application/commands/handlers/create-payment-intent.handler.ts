import { Inject } from '@nestjs/common';
import {
	CommandBus,
	CommandHandler,
	ICommandHandler,
	QueryBus,
} from '@nestjs/cqrs';
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
import { assertOrderResult } from '@/shared/ordering/readers/order-result.guard';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/shared/payments';
import { UnitOfWork } from '@/lib/database/unit-of-work';

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
			const order = await this.queryBus.execute(
				new GetOrderQuery(command),
			);
			assertOrderResult(order);

			const payment = PaymentIntent.create({
				orderId: command.orderId,
				amount: order.amount,
				currency: order.currency,
			});
			await this.paymentRepository.persist(payment);

			await this.commandBus.execute(
				new AttachPaymentToOrderCommand({
					orderId: command.orderId,
					paymentId: payment.id,
				}),
			);

			const outcome = command.simulateOutcome ?? 'SUCCEEDED';
			const delaySeconds = command.simulateDelaySeconds;

			const event =
				outcome === 'SUCCEEDED'
					? new PaymentWebhookSucceededEvent({
							orderId: command.orderId,
							paymentId: payment.id,
						})
					: new PaymentWebhookFailedEvent({
							orderId: command.orderId,
							paymentId: payment.id,
						});

			const outboxId = await this.outboxProducer.publish(event, {
				delaySeconds,
				messageGroupId: command.orderId,
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

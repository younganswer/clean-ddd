import { Inject } from '@nestjs/common';
import {
	CommandBus,
	CommandHandler,
	ICommandHandler,
	QueryBus,
} from '@nestjs/cqrs';
import {
	IOutboxProducerSymbol,
	type IOutboxProducer,
} from '@/shared/outbox/domain/producers/i.outbox.producer';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';
import { GetOrderQuery } from '@/modules/ordering/application/queries/get-order.query';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/contracts/payments';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/modules/payments/application/commands/create-payment-intent.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@Inject(IOutboxProducerSymbol)
		private readonly outboxProducer: IOutboxProducer,
		private readonly uow: UnitOfWork,
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		return this.uow.transaction(async () => {
			const orderSnapshot = await this.queryBus.execute(
				new GetOrderQuery({ orderId: command.orderId }),
			);
			if (!orderSnapshot) {
				throw ApplicationErrorFactory.create(
					ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
					{ details: { id: command.orderId } },
				);
			}

			const payment = PaymentIntent.create({
				orderId: command.orderId,
				amount: orderSnapshot.amount,
				currency: orderSnapshot.currency,
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

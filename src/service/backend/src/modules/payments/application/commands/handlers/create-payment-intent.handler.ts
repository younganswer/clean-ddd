import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { AttachPaymentToOrderCommand } from '@/shared/ordering/commands/attach-payment-to-order.command';
import {
	PaymentWebhookFailedEvent,
	PaymentWebhookSucceededEvent,
} from '@/shared/payments';
import {
	type IOrderPaymentSnapshotReader,
	IOrderPaymentSnapshotReaderSymbol,
} from '@/shared/ordering/readers/i.order-payment-snapshot.reader';
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
		@Inject(IOrderPaymentSnapshotReaderSymbol)
		private readonly orderPaymentSnapshotReader: IOrderPaymentSnapshotReader,
		private readonly uow: UnitOfWork,
		private readonly outboxProducer: OutboxProducer,
		private readonly commandBus: CommandBus,
	) {}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		return this.uow.transaction(async () => {
			const orderSnapshot =
				await this.orderPaymentSnapshotReader.getByOrderId(
					command.orderId,
				);

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

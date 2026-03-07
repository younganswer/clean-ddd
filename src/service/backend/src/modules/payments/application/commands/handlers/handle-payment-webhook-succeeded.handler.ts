import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { OutboxProducer } from '@/modules/outbox/application/outbox.producer';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentFulfillmentRequestedEvent } from '@/shared/payments';
import { HandlePaymentWebhookSucceededCommand } from '@/shared/payments/commands/handle-payment-webhook-succeeded.command';

@CommandHandler(HandlePaymentWebhookSucceededCommand)
export class HandlePaymentWebhookSucceededHandler implements ICommandHandler<HandlePaymentWebhookSucceededCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
		private readonly outboxProducer: OutboxProducer,
	) {}

	async execute(
		command: HandlePaymentWebhookSucceededCommand,
	): Promise<void> {
		await this.uow.transaction(async () => {
			const payment = await this.paymentRepository.getById(
				command.paymentId,
			);
			payment.markSucceeded();
			await this.paymentRepository.persist(payment);

			await this.outboxProducer.publish(
				new PaymentFulfillmentRequestedEvent({
					orderId: command.orderId,
				}),
				{ messageGroupId: command.orderId },
			);
		});
	}
}

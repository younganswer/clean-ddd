import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IOutboxProducerSymbol,
	type IOutboxProducer,
} from '@/shared/outbox/domain/producers/i.outbox.producer';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';

@CommandHandler(HandlePaymentWebhookSucceededCommand)
export class HandlePaymentWebhookSucceededHandler implements ICommandHandler<HandlePaymentWebhookSucceededCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@Inject(IOutboxProducerSymbol)
		private readonly outboxProducer: IOutboxProducer,
		private readonly uow: UnitOfWork,
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

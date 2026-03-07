import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domains/repositories/i.payment.repository';
import { HandlePaymentWebhookFailedCommand } from '@/shared/payments/commands/handle-payment-webhook-failed.command';

@CommandHandler(HandlePaymentWebhookFailedCommand)
export class HandlePaymentWebhookFailedHandler implements ICommandHandler<HandlePaymentWebhookFailedCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		private readonly uow: UnitOfWork,
	) {}

	async execute(command: HandlePaymentWebhookFailedCommand): Promise<void> {
		await this.uow.transaction(async () => {
			const payment = await this.paymentRepository.getById(
				command.paymentId,
			);
			payment.markFailed();
			await this.paymentRepository.persist(payment);
		});
	}
}

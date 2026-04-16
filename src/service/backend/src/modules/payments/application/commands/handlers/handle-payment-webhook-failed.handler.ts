import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domain/repositories/i.payment.repository';
import { HandlePaymentWebhookFailedCommand } from '@/modules/payments/application/commands/handle-payment-webhook-failed.command';
import { PaymentStatus } from '@/modules/payments/domain/enums/payment-status.enum';

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

			if (payment.status !== PaymentStatus.PENDING) {
				return;
			}

			payment.markFailed();
			await this.paymentRepository.persist(payment);
		});
	}
}

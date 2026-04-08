import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import {
	IOutboxProducerSymbol,
	type IOutboxProducer,
} from '@/shared/outbox/domain/producers/i.outbox.producer';
import {
	IPaymentRepositorySymbol,
	type IPaymentRepository,
} from '@/modules/payments/domains/repositories/i.payment.repository';
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { isOutboxHandlerImmediateDispatchEnabled } from '@/bootstrap/runtime-role';

interface HandlePaymentWebhookSucceededExecution {
	orderId: string;
	paymentId: string;
	paymentLoadMs: number;
	paymentPersistMs: number;
	fulfillmentOutboxPublishMs: number;
	duplicateIgnored?: boolean;
	immediateDispatchTarget?: {
		outboxId: string;
		messageGroupId: string;
	};
}

@CommandHandler(HandlePaymentWebhookSucceededCommand)
export class HandlePaymentWebhookSucceededHandler implements ICommandHandler<HandlePaymentWebhookSucceededCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@Inject(IOutboxProducerSymbol)
		private readonly outboxProducer: IOutboxProducer,
		private readonly commandBus: CommandBus,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: HandlePaymentWebhookSucceededCommand,
	): Promise<void> {
		const transactionResult =
			await this.uow.transaction<HandlePaymentWebhookSucceededExecution>(
				async () => {
					const payment = await this.paymentRepository.getById(
						command.paymentId,
					);

					if (payment.status === PaymentStatus.SUCCEEDED) {
						return {
							orderId: command.orderId,
							paymentId: command.paymentId,
							paymentLoadMs: 0,
							paymentPersistMs: 0,
							fulfillmentOutboxPublishMs: 0,
							duplicateIgnored: true,
						};
					}

					payment.markSucceeded();
					await this.paymentRepository.persist(payment);

					const fulfillmentOutboxId =
						await this.outboxProducer.publish(
							new PaymentFulfillmentRequestedEvent({
								orderId: command.orderId,
							}),
							{ messageGroupId: command.orderId },
						);

					return {
						orderId: command.orderId,
						paymentId: command.paymentId,
						paymentLoadMs: 0,
						paymentPersistMs: 0,
						fulfillmentOutboxPublishMs: 0,
						immediateDispatchTarget: {
							outboxId: fulfillmentOutboxId,
							messageGroupId: command.orderId,
						},
					};
				},
			);

		const immediateDispatchEnabled =
			isOutboxHandlerImmediateDispatchEnabled();
		if (!immediateDispatchEnabled) {
			return;
		}

		const target = transactionResult.immediateDispatchTarget;
		if (!target) {
			return;
		}

		try {
			await this.commandBus.execute(
				new DispatchOutboxEventCommand({
					outboxId: target.outboxId,
					messageGroupId: target.messageGroupId,
				}),
			);
		} catch {
			return;
		}
	}
}

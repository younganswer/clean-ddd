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
import { PaymentFulfillmentRequestedEvent } from '@/contracts/payments/events/payment-fulfillment-requested.event';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import {
	measureAsyncStep,
	runLoggedAsync,
} from '@/common/logging/structured-log';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';

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
		await runLoggedAsync(
			{
				context: HandlePaymentWebhookSucceededHandler.name,
				args: [command] as const,
				completed: {
					step: 'payment_webhook_succeeded_completed',
					durationFieldName: 'handlerTotalMs',
					getPayload: (_args, payload) => payload,
				},
			},
			async () =>
				await this.uow.transaction(async () => {
					const { result: payment, durationMs: paymentLoadMs } =
						await measureAsyncStep(
							async () =>
								await this.paymentRepository.getById(
									command.paymentId,
								),
						);

					if (payment.status === PaymentStatus.SUCCEEDED) {
						return {
							orderId: command.orderId,
							paymentId: command.paymentId,
							paymentLoadMs,
							paymentPersistMs: 0,
							fulfillmentOutboxPublishMs: 0,
							duplicateIgnored: true,
						};
					}

					payment.markSucceeded();
					const { durationMs: paymentPersistMs } =
						await measureAsyncStep(async () => {
							await this.paymentRepository.persist(payment);
						});

					const { durationMs: fulfillmentOutboxPublishMs } =
						await measureAsyncStep(async () => {
							await this.outboxProducer.publish(
								new PaymentFulfillmentRequestedEvent({
									orderId: command.orderId,
								}),
								{ messageGroupId: command.orderId },
							);
						});

					return {
						orderId: command.orderId,
						paymentId: command.paymentId,
						paymentLoadMs,
						paymentPersistMs,
						fulfillmentOutboxPublishMs,
					};
				}),
		);
	}
}

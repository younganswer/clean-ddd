import { Inject } from '@nestjs/common';
import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import {
	IOutboxProducerSymbol,
	type IOutboxProducer,
} from '@/shared/outbox/domain/producers/i.outbox.producer';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import {
	IOrderReaderSymbol,
	type IOrderReader,
} from '@/modules/ordering/domains/readers/i.order.reader';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { PaymentWebhookFailedEvent } from '@/contracts/payments/events/payment-webhook-failed.event';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import {
	CreatePaymentIntentCommand,
	type CreatePaymentIntentResult,
} from '@/modules/payments/application/commands/create-payment-intent.command';
import { UnitOfWork } from '@/lib/database/unit-of-work';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { isOutboxHandlerImmediateDispatchEnabled } from '@/runtime-role';

interface CreatePaymentIntentTransactionResult {
	response: CreatePaymentIntentResult;
	immediateDispatchTargets: {
		outboxId: string;
		messageGroupId: string;
	}[];
}

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		@Inject(IOutboxProducerSymbol)
		private readonly outboxProducer: IOutboxProducer,
		private readonly commandBus: CommandBus,
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		const transactionResult =
			await this.uow.transaction<CreatePaymentIntentTransactionResult>(
				async () => {
					const orderSnapshot = await this.orderReader.findById(
						command.orderId,
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

					const paymentIntentCreatedOutboxId =
						await this.outboxProducer.publish(
							new PaymentIntentCreatedEvent({
								orderId: command.orderId,
								paymentId: payment.id,
							}),
							{ messageGroupId: command.orderId },
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

					const immediateDispatchTargets = [
						{
							outboxId: paymentIntentCreatedOutboxId,
							messageGroupId: command.orderId,
						},
					];

					if (delaySeconds <= 0) {
						immediateDispatchTargets.push({
							outboxId,
							messageGroupId: command.orderId,
						});
					}

					return {
						response: {
							paymentId: payment.id,
							status: payment.status,
							scheduled: {
								eventType,
								delaySeconds,
								outboxId,
							},
						},
						immediateDispatchTargets,
					};
				},
			);

		if (!isOutboxHandlerImmediateDispatchEnabled()) {
			return transactionResult.response;
		}

		for (const target of transactionResult.immediateDispatchTargets) {
			try {
				await this.commandBus.execute(
					new DispatchOutboxEventCommand({
						outboxId: target.outboxId,
						messageGroupId: target.messageGroupId,
					}),
				);
			} catch {
				continue;
			}
		}

		return transactionResult.response;
	}
}

import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
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
import {
	measureAsyncStep,
	runLoggedAsync,
} from '@/common/logging/structured-log';

interface CreatePaymentIntentExecution {
	response: CreatePaymentIntentResult;
	completionLog: Record<string, unknown>;
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
		private readonly uow: UnitOfWork,
	) {}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		const execution = await runLoggedAsync(
			{
				context: CreatePaymentIntentHandler.name,
				args: [command] as const,
				started: {
					step: 'create_payment_intent_started',
					getPayload: ([currentCommand]) => ({
						orderId: currentCommand.orderId,
						simulateOutcome: currentCommand.simulateOutcome,
						simulateDelaySeconds:
							currentCommand.simulateDelaySeconds,
					}),
				},
				completed: {
					step: 'create_payment_intent_completed',
					durationFieldName: 'handlerTotalMs',
					getPayload: (_args, result) => result.completionLog,
				},
			},
			async (): Promise<CreatePaymentIntentExecution> =>
				await this.uow.transaction(async () => {
					const { result: orderSnapshot, durationMs: orderLookupMs } =
						await measureAsyncStep(
							async () =>
								await this.orderReader.findById(
									command.orderId,
								),
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
					const { durationMs: paymentPersistMs } =
						await measureAsyncStep(async () => {
							await this.paymentRepository.persist(payment);
						});

					const { durationMs: paymentCreatedOutboxPublishMs } =
						await measureAsyncStep(async () => {
							await this.outboxProducer.publish(
								new PaymentIntentCreatedEvent({
									orderId: command.orderId,
									paymentId: payment.id,
								}),
								{ messageGroupId: command.orderId },
							);
						});

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

					const {
						result: outboxId,
						durationMs: webhookOutboxPublishMs,
					} = await measureAsyncStep(
						async () =>
							await this.outboxProducer.publish(event, {
								delaySeconds,
								messageGroupId: command.orderId,
							}),
					);

					const eventType =
						outcome === 'SUCCEEDED'
							? PaymentWebhookSucceededEvent.eventType
							: PaymentWebhookFailedEvent.eventType;

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
						completionLog: {
							orderId: command.orderId,
							paymentId: payment.id,
							eventType,
							outboxId,
							simulateDelaySeconds: delaySeconds,
							orderLookupMs,
							paymentPersistMs,
							paymentCreatedOutboxPublishMs,
							webhookOutboxPublishMs,
						},
					};
				}),
		);

		return execution.response;
	}
}

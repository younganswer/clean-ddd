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
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { DispatchOutboxEventCommand } from '@/modules/outbox/application/commands/dispatch-outbox-event.command';
import { isOutboxHandlerImmediateDispatchEnabled } from '@/bootstrap/runtime-role';
import {
	IOutboxDelayedDispatchTriggerSymbol,
	type IOutboxDelayedDispatchTrigger,
} from '@/shared/outbox/domain/schedulers/i.outbox-delayed-dispatch-trigger';

interface CreatePaymentIntentTransactionResult {
	response: CreatePaymentIntentResult;
	immediateDispatchTargets: {
		outboxId: string;
		messageGroupId: string;
	}[];
	delayedDispatchTarget?: {
		outboxId: string;
		messageGroupId: string;
		delaySeconds: number;
	};
}

type WebhookSchedule = {
	event: PaymentWebhookSucceededEvent | PaymentWebhookFailedEvent;
	eventType: string;
	delaySeconds: number;
};

@CommandHandler(CreatePaymentIntentCommand)
export class CreatePaymentIntentHandler implements ICommandHandler<CreatePaymentIntentCommand> {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
		@Inject(IOrderReaderSymbol)
		private readonly orderReader: IOrderReader,
		@Inject(IOutboxProducerSymbol)
		private readonly outboxProducer: IOutboxProducer,
		@Inject(IOutboxDelayedDispatchTriggerSymbol)
		private readonly delayedDispatchTrigger: IOutboxDelayedDispatchTrigger,
		private readonly commandBus: CommandBus,
		private readonly uow: UnitOfWork,
	) {}

	private async loadOrderSnapshot(orderId: string) {
		const orderSnapshot = await this.orderReader.findById(orderId);
		if (!orderSnapshot) {
			throw ApplicationExceptionFactory.create(
				OrderingOrderNotFoundException,
				{ cause: { id: orderId } },
			);
		}

		return orderSnapshot;
	}

	private async createAndPersistPayment(params: {
		orderId: string;
		amount: number;
		currency: string;
	}): Promise<PaymentIntent> {
		const payment = PaymentIntent.create({
			orderId: params.orderId,
			amount: params.amount,
			currency: params.currency,
		});
		await this.paymentRepository.persist(payment);
		return payment;
	}

	private buildWebhookSchedule(
		command: CreatePaymentIntentCommand,
		paymentId: string,
	): WebhookSchedule {
		const outcome = command.simulateOutcome ?? 'SUCCEEDED';
		const delaySeconds = command.simulateDelaySeconds;

		if (outcome === 'SUCCEEDED') {
			return {
				event: new PaymentWebhookSucceededEvent({
					orderId: command.orderId,
					paymentId,
				}),
				eventType: PaymentWebhookSucceededEvent.eventType,
				delaySeconds,
			};
		}

		return {
			event: new PaymentWebhookFailedEvent({
				orderId: command.orderId,
				paymentId,
			}),
			eventType: PaymentWebhookFailedEvent.eventType,
			delaySeconds,
		};
	}

	private async publishPaymentIntentCreated(
		orderId: string,
		paymentId: string,
	): Promise<string> {
		return await this.outboxProducer.publish(
			new PaymentIntentCreatedEvent({
				orderId,
				paymentId,
			}),
			{ messageGroupId: orderId },
		);
	}

	private async publishWebhookEvent(params: {
		event: PaymentWebhookSucceededEvent | PaymentWebhookFailedEvent;
		orderId: string;
		delaySeconds: number;
	}): Promise<string> {
		return await this.outboxProducer.publish(params.event, {
			delaySeconds: params.delaySeconds,
			messageGroupId: params.orderId,
		});
	}

	private buildTransactionResult(params: {
		payment: PaymentIntent;
		orderId: string;
		eventType: string;
		delaySeconds: number;
		paymentIntentCreatedOutboxId: string;
		webhookOutboxId: string;
	}): CreatePaymentIntentTransactionResult {
		const immediateDispatchTargets = [
			{
				outboxId: params.paymentIntentCreatedOutboxId,
				messageGroupId: params.orderId,
			},
		];

		if (params.delaySeconds <= 0) {
			immediateDispatchTargets.push({
				outboxId: params.webhookOutboxId,
				messageGroupId: params.orderId,
			});
		}

		return {
			response: {
				paymentId: params.payment.id,
				status: params.payment.status,
				scheduled: {
					eventType: params.eventType,
					delaySeconds: params.delaySeconds,
					outboxId: params.webhookOutboxId,
				},
			},
			immediateDispatchTargets,
			...(params.delaySeconds > 0
				? {
						delayedDispatchTarget: {
							outboxId: params.webhookOutboxId,
							messageGroupId: params.orderId,
							delaySeconds: params.delaySeconds,
						},
					}
				: {}),
		};
	}

	private async executeInTransaction(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentTransactionResult> {
		const orderSnapshot = await this.loadOrderSnapshot(command.orderId);
		const payment = await this.createAndPersistPayment({
			orderId: command.orderId,
			amount: orderSnapshot.amount,
			currency: orderSnapshot.currency,
		});

		const paymentIntentCreatedOutboxId =
			await this.publishPaymentIntentCreated(command.orderId, payment.id);
		const webhookSchedule = this.buildWebhookSchedule(command, payment.id);
		const webhookOutboxId = await this.publishWebhookEvent({
			event: webhookSchedule.event,
			orderId: command.orderId,
			delaySeconds: webhookSchedule.delaySeconds,
		});

		return this.buildTransactionResult({
			payment,
			orderId: command.orderId,
			eventType: webhookSchedule.eventType,
			delaySeconds: webhookSchedule.delaySeconds,
			paymentIntentCreatedOutboxId,
			webhookOutboxId,
		});
	}

	private async scheduleDelayedDispatchIfNeeded(
		target: CreatePaymentIntentTransactionResult['delayedDispatchTarget'],
	): Promise<void> {
		if (!target) {
			return;
		}

		await this.delayedDispatchTrigger.scheduleOneShot(target);
	}

	private async dispatchImmediateTargetsIfEnabled(
		targets: CreatePaymentIntentTransactionResult['immediateDispatchTargets'],
	): Promise<void> {
		if (!isOutboxHandlerImmediateDispatchEnabled()) {
			return;
		}

		for (const target of targets) {
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
	}

	async execute(
		command: CreatePaymentIntentCommand,
	): Promise<CreatePaymentIntentResult> {
		const transactionResult =
			await this.uow.transaction<CreatePaymentIntentTransactionResult>(
				async () => await this.executeInTransaction(command),
			);

		await this.scheduleDelayedDispatchIfNeeded(
			transactionResult.delayedDispatchTarget,
		);
		await this.dispatchImmediateTargetsIfEnabled(
			transactionResult.immediateDispatchTargets,
		);

		return transactionResult.response;
	}
}

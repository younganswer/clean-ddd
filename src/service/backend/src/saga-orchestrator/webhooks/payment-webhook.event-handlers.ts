import { Injectable } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentWebhookFailedEvent } from '@/contracts/payments/events/payment-webhook-failed.event';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { HandlePaymentWebhookFailedCommand } from '@/modules/payments/application/commands/handle-payment-webhook-failed.command';
import { LogAsyncExecution } from '@/common/logging/log-async-execution.decorator';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
@OutboxKnownHandler(PaymentWebhookSucceededEvent.eventType)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	@LogAsyncExecution<[PaymentWebhookSucceededEvent], void>({
		started: {
			step: 'payment_webhook_succeeded_received',
			getPayload: ([event]) => ({
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		},
		completed: {
			step: 'payment_webhook_succeeded_handled_via_command_bus',
			getPayload: ([event]) => ({
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		},
	})
	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		const { orderId, paymentId } = event;
		await this.commandBus.execute(
			new HandlePaymentWebhookSucceededCommand({
				orderId,
				paymentId,
			}),
		);
	}
}

@Injectable()
@EventsHandler(PaymentWebhookFailedEvent)
@OutboxKnownHandler(PaymentWebhookFailedEvent.eventType)
export class PaymentWebhookFailedHandler implements IEventHandler<PaymentWebhookFailedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	@LogAsyncExecution<[PaymentWebhookFailedEvent], void>({
		started: {
			step: 'payment_webhook_failed_received',
			getPayload: ([event]) => ({
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		},
		completed: {
			step: 'payment_webhook_failed_handled_via_command_bus',
			getPayload: ([event]) => ({
				paymentId: event.paymentId,
			}),
		},
	})
	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		const { paymentId } = event;
		await this.commandBus.execute(
			new HandlePaymentWebhookFailedCommand({ paymentId }),
		);
	}
}

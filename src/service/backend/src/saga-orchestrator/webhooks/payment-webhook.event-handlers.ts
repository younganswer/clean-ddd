import { Injectable, Logger } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentWebhookFailedEvent } from '@/contracts/payments/events/payment-webhook-failed.event';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { OutboxKnownHandler } from '@/common/outbox/outbox-known-handler.decorator';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { HandlePaymentWebhookFailedCommand } from '@/modules/payments/application/commands/handle-payment-webhook-failed.command';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
@OutboxKnownHandler(PaymentWebhookSucceededEvent.eventType)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	private readonly logger = new Logger(PaymentWebhookSucceededHandler.name);

	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_succeeded_received',
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		);

		const { orderId, paymentId } = event;
		await this.commandBus.execute(
			new HandlePaymentWebhookSucceededCommand({
				orderId,
				paymentId,
			}),
		);

		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_succeeded_handled_via_command_bus',
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
	private readonly logger = new Logger(PaymentWebhookFailedHandler.name);

	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_failed_received',
				orderId: event.orderId,
				paymentId: event.paymentId,
			}),
		);

		const { paymentId } = event;
		await this.commandBus.execute(
			new HandlePaymentWebhookFailedCommand({ paymentId }),
		);

		this.logger.log(
			JSON.stringify({
				step: 'payment_webhook_failed_handled_via_command_bus',
				paymentId,
			}),
		);
	}
}

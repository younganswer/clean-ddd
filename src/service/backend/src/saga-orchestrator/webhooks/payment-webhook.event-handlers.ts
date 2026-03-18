import { Injectable } from '@nestjs/common';
import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentWebhookFailedEvent } from '@/contracts/payments/events/payment-webhook-failed.event';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { HandlePaymentWebhookFailedCommand } from '@/modules/payments/application/commands/handle-payment-webhook-failed.command';

@Injectable()
@EventsHandler(PaymentWebhookSucceededEvent)
@OutboxKnownHandler(PaymentWebhookSucceededEvent.eventType)
export class PaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		const command = new HandlePaymentWebhookSucceededCommand(event);
		await this.commandBus.execute(command);
	}
}

@Injectable()
@EventsHandler(PaymentWebhookFailedEvent)
@OutboxKnownHandler(PaymentWebhookFailedEvent.eventType)
export class PaymentWebhookFailedHandler implements IEventHandler<PaymentWebhookFailedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookFailedEvent): Promise<void> {
		const command = new HandlePaymentWebhookFailedCommand(event);
		await this.commandBus.execute(command);
	}
}

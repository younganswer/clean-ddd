import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { OutboxKnownHandler } from '@/lib/outbox/outbox-known-handler.decorator';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';

@EventsHandler(PaymentIntentCreatedEvent)
@OutboxKnownHandler(PaymentIntentCreatedEvent.eventType)
export class AttachPaymentOnPaymentIntentCreatedHandler implements IEventHandler<PaymentIntentCreatedEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentIntentCreatedEvent): Promise<void> {
		const command = new AttachPaymentToOrderCommand({
			orderId: event.orderId,
			paymentId: event.paymentId,
		});
		await this.commandBus.execute(command);
	}
}

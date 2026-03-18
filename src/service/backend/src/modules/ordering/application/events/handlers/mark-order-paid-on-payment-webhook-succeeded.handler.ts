import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentWebhookSucceededEvent } from '@/contracts/payments/events/payment-webhook-succeeded.event';
import { MarkOrderPaidCommand } from '@/modules/ordering/application/commands/mark-order-paid.command';

@EventsHandler(PaymentWebhookSucceededEvent)
export class MarkOrderPaidOnPaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		const command = new MarkOrderPaidCommand(event);
		await this.commandBus.execute(command);
	}
}

import { CommandBus, EventsHandler, IEventHandler } from '@nestjs/cqrs';
import { PaymentWebhookSucceededEvent } from '@/shared/payments';
import { MarkOrderPaidCommand } from '@/modules/ordering/application/commands/mark-order-paid.command';

@EventsHandler(PaymentWebhookSucceededEvent)
export class MarkOrderPaidOnPaymentWebhookSucceededHandler implements IEventHandler<PaymentWebhookSucceededEvent> {
	constructor(private readonly commandBus: CommandBus) {}

	async handle(event: PaymentWebhookSucceededEvent): Promise<void> {
		await this.commandBus.execute(
			new MarkOrderPaidCommand({ orderId: event.orderId }),
		);
	}
}

import { CommandBus } from '@nestjs/cqrs';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';
import { AttachPaymentOnPaymentIntentCreatedHandler } from '@/modules/ordering/application/events/handlers/attach-payment-on-payment-intent-created.handler';

describe('AttachPaymentOnPaymentIntentCreatedHandler', () => {
	it('dispatches AttachPaymentToOrderCommand from payment intent created event', async () => {
		const execute = jest.fn(() => Promise.resolve(undefined));
		const commandBus = { execute } as unknown as CommandBus;
		const handler = new AttachPaymentOnPaymentIntentCreatedHandler(
			commandBus,
		);

		await handler.handle(
			new PaymentIntentCreatedEvent({
				orderId: 'order-1',
				paymentId: 'payment-1',
			}),
		);

		expect(execute).toHaveBeenCalledTimes(1);
		const calls = execute.mock.calls as unknown[][];
		expect(calls[0]?.[0]).toBeInstanceOf(AttachPaymentToOrderCommand);
	});
});

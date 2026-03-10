import { Test } from '@nestjs/testing';
import { CqrsModule, CommandBus, EventBus } from '@nestjs/cqrs';
import { PaymentIntentCreatedEvent } from '@/contracts/payments/events/payment-intent-created.event';
import { AttachPaymentOnPaymentIntentCreatedHandler } from '@/modules/ordering/application/events/handlers/attach-payment-on-payment-intent-created.handler';
import { AttachPaymentToOrderCommand } from '@/modules/ordering/application/commands/attach-payment-to-order.command';

describe('PaymentIntentCreatedEvent handler wiring (integration)', () => {
	it('dispatches ordering attach command when payment intent created event is published', async () => {
		const moduleRef = await Test.createTestingModule({
			imports: [CqrsModule],
			providers: [AttachPaymentOnPaymentIntentCreatedHandler],
		}).compile();

		await moduleRef.init();

		const commandBus = moduleRef.get(CommandBus);
		const commandExecuteSpy = jest
			.spyOn(commandBus, 'execute')
			.mockResolvedValue(undefined);
		const eventBus = moduleRef.get(EventBus);

		await eventBus.publish(
			new PaymentIntentCreatedEvent({
				orderId: 'order-300',
				paymentId: 'pay-300',
			}),
		);

		for (let i = 0; i < 20; i += 1) {
			if (commandExecuteSpy.mock.calls.length > 0) {
				break;
			}
			await new Promise((resolve) => setTimeout(resolve, 10));
		}

		expect(commandExecuteSpy).toHaveBeenCalledTimes(1);
		expect(commandExecuteSpy).toHaveBeenCalledWith(
			expect.any(AttachPaymentToOrderCommand),
		);

		const firstCallArg = commandExecuteSpy.mock.calls[0]?.[0];
		expect(firstCallArg).toMatchObject({
			orderId: 'order-300',
			paymentId: 'pay-300',
		});
	});
});

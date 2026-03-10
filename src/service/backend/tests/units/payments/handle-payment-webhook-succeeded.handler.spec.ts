import { HandlePaymentWebhookSucceededHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-succeeded.handler';
import { HandlePaymentWebhookSucceededCommand } from '@/modules/payments/application/commands/handle-payment-webhook-succeeded.command';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IOutboxProducer } from '@/shared/outbox/domain/producers/i.outbox.producer';
import type { UnitOfWork } from '@/lib/database/unit-of-work';

describe('HandlePaymentWebhookSucceededHandler', () => {
	it('ignores duplicate succeeded webhook when payment is already succeeded', async () => {
		const payment = PaymentIntent.rehydrate({
			id: 'payment-1',
			orderId: 'order-1',
			amount: 1000,
			currency: 'KRW',
			status: PaymentStatus.SUCCEEDED,
		});
		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const findByIdMock = jest.fn(() => Promise.resolve(payment));
		const getByIdMock = jest.fn(() => Promise.resolve(payment));
		const findRecentMock = jest.fn(() => Promise.resolve([]));

		const paymentRepository = {
			persist: persistMock,
			findById: findByIdMock,
			getById: getByIdMock,
			findRecent: findRecentMock,
		} as unknown as IPaymentRepository;
		const publishMock = jest.fn(() => Promise.resolve('outbox-1'));

		const outboxProducer = {
			publish: publishMock,
		} as unknown as IOutboxProducer;

		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new HandlePaymentWebhookSucceededHandler(
			paymentRepository,
			outboxProducer,
			uow as UnitOfWork,
		);

		await expect(
			handler.execute(
				new HandlePaymentWebhookSucceededCommand({
					orderId: 'order-1',
					paymentId: 'payment-1',
				}),
			),
		).resolves.toBeUndefined();

		expect(getByIdMock).toHaveBeenCalledWith('payment-1');
		expect(persistMock).not.toHaveBeenCalled();
		expect(publishMock).not.toHaveBeenCalled();
	});
});

/// <reference types="jest" />

import { HandlePaymentWebhookFailedHandler } from '@/modules/payments/application/commands/handlers/handle-payment-webhook-failed.handler';
import { HandlePaymentWebhookFailedCommand } from '@/modules/payments/application/commands/handle-payment-webhook-failed.command';
import { PaymentIntent } from '@/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { UnitOfWork } from '@/lib/database/unit-of-work';

describe('HandlePaymentWebhookFailedHandler', () => {
	it('marks pending payment as failed', async () => {
		const payment = PaymentIntent.rehydrate({
			id: 'payment-1',
			orderId: 'order-1',
			amount: 1000,
			currency: 'KRW',
			status: PaymentStatus.PENDING,
		});
		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const getByIdMock = jest.fn(() => Promise.resolve(payment));

		const paymentRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(payment)),
			getById: getByIdMock,
			findRecent: jest.fn(() => Promise.resolve([])),
		} as unknown as IPaymentRepository;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new HandlePaymentWebhookFailedHandler(
			paymentRepository,
			uow as UnitOfWork,
		);

		const command = new HandlePaymentWebhookFailedCommand({
			paymentId: 'payment-1',
		});
		await expect(handler.execute(command)).resolves.toBeUndefined();

		expect(getByIdMock).toHaveBeenCalledWith('payment-1');
		expect(payment.status).toBe(PaymentStatus.FAILED);
		expect(persistMock).toHaveBeenCalledTimes(1);
	});

	it('ignores duplicate failed webhook when payment is already failed', async () => {
		const payment = PaymentIntent.rehydrate({
			id: 'payment-1',
			orderId: 'order-1',
			amount: 1000,
			currency: 'KRW',
			status: PaymentStatus.FAILED,
		});
		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const getByIdMock = jest.fn(() => Promise.resolve(payment));

		const paymentRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(payment)),
			getById: getByIdMock,
			findRecent: jest.fn(() => Promise.resolve([])),
		} as unknown as IPaymentRepository;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new HandlePaymentWebhookFailedHandler(
			paymentRepository,
			uow as UnitOfWork,
		);

		const command = new HandlePaymentWebhookFailedCommand({
			paymentId: 'payment-1',
		});
		await expect(handler.execute(command)).resolves.toBeUndefined();

		expect(getByIdMock).toHaveBeenCalledWith('payment-1');
		expect(payment.status).toBe(PaymentStatus.FAILED);
		expect(persistMock).not.toHaveBeenCalled();
	});

	it('ignores failed webhook when payment is already succeeded', async () => {
		const payment = PaymentIntent.rehydrate({
			id: 'payment-1',
			orderId: 'order-1',
			amount: 1000,
			currency: 'KRW',
			status: PaymentStatus.SUCCEEDED,
		});
		const persistMock = jest.fn(() => Promise.resolve(undefined));
		const getByIdMock = jest.fn(() => Promise.resolve(payment));

		const paymentRepository = {
			persist: persistMock,
			findById: jest.fn(() => Promise.resolve(payment)),
			getById: getByIdMock,
			findRecent: jest.fn(() => Promise.resolve([])),
		} as unknown as IPaymentRepository;
		const uow: Pick<UnitOfWork, 'transaction'> = {
			transaction: <T>(work: (em: never) => Promise<T>): Promise<T> =>
				work(undefined as never),
		};

		const handler = new HandlePaymentWebhookFailedHandler(
			paymentRepository,
			uow as UnitOfWork,
		);

		const command = new HandlePaymentWebhookFailedCommand({
			paymentId: 'payment-1',
		});
		await expect(handler.execute(command)).resolves.toBeUndefined();

		expect(getByIdMock).toHaveBeenCalledWith('payment-1');
		expect(payment.status).toBe(PaymentStatus.SUCCEEDED);
		expect(persistMock).not.toHaveBeenCalled();
	});
});

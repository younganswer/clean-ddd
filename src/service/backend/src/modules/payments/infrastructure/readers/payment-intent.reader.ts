import { Inject, Injectable } from '@nestjs/common';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/shared/readers/payments/i.payment-intent.reader';
import type { PaymentIntentView as PaymentIntentViewDto } from '@/shared/readers/payments/dto/payment-intent.view';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';

@Injectable()
export class PaymentIntentReader implements IPaymentIntentReader {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly payments: IPaymentRepository,
	) {}

	async findById(paymentId: string): Promise<PaymentIntentViewDto | null> {
		const payment = await this.payments.findById(paymentId);
		if (!payment) return null;
		return this.toView(payment);
	}

	async findRecent(limit: number): Promise<PaymentIntentViewDto[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const payments = await this.payments.findRecent(safeLimit);
		return payments.map((p) => this.toView(p));
	}

	private toView(payment: {
		toPrimitives(): {
			paymentId: string;
			orderId: string;
			amount: number;
			currency: string;
			status: PaymentIntentViewDto['status'];
			createdAt: Date;
			updatedAt: Date;
		};
	}): PaymentIntentViewDto {
		const primitives = payment.toPrimitives();
		return {
			...primitives,
			createdAt: primitives.createdAt.toISOString(),
			updatedAt: primitives.updatedAt.toISOString(),
		};
	}
}

export const PaymentIntentReaderProvider = {
	provide: IPaymentIntentReaderSymbol,
	useClass: PaymentIntentReader,
};

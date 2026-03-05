import { Inject, Injectable } from '@nestjs/common';
import {
	IPaymentIntentReaderSymbol,
	type IPaymentIntentReader,
} from '@/shared/readers/payments/i.payment-intent.reader';
import type { PaymentIntentResult as PaymentIntentResultDto } from '@/shared/readers/payments/dto/payment-intent.result';
import { IPaymentRepositorySymbol } from '@/modules/payments/domains/repositories/i.payment.repository';
import type { IPaymentRepository } from '@/modules/payments/domains/repositories/i.payment.repository';

@Injectable()
export class PaymentIntentReader implements IPaymentIntentReader {
	constructor(
		@Inject(IPaymentRepositorySymbol)
		private readonly paymentRepository: IPaymentRepository,
	) {}

	async findById(id: string): Promise<PaymentIntentResultDto | null> {
		const payment = await this.paymentRepository.findById(id);
		if (!payment) return null;
		return this.toResult(payment);
	}

	async findRecent(limit: number): Promise<PaymentIntentResultDto[]> {
		const safeLimit = Math.min(50, Math.max(1, Number(limit ?? 20)));
		const payments = await this.paymentRepository.findRecent(safeLimit);
		return payments.map((p) => this.toResult(p));
	}

	private toResult(payment: {
		toPrimitives(): {
			paymentId: string;
			orderId: string;
			amount: number;
			currency: string;
			status: PaymentIntentResultDto['status'];
		};
	}): PaymentIntentResultDto {
		return payment.toPrimitives();
	}
}

export const PaymentIntentReaderProvider = {
	provide: IPaymentIntentReaderSymbol,
	useClass: PaymentIntentReader,
};

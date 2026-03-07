import { BaseEntity } from '@/common/domain/base.entity';
import { PaymentStatus } from '@/modules/payments/domains/enums/payment-status.enum';
import { PAYMENTS_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';
import { randomUUID } from 'node:crypto';

export class PaymentIntent extends BaseEntity {
	private constructor(
		id: string,
		private readonly _orderId: string,
		private readonly _amount: number,
		private readonly _currency: string,
		private _status: PaymentStatus,
	) {
		super(id);
	}

	static create(input: {
		orderId: string;
		amount: number;
		currency: string;
	}): PaymentIntent {
		return new PaymentIntent(
			randomUUID(),
			input.orderId,
			input.amount,
			input.currency,
			PaymentStatus.PENDING,
		);
	}

	static rehydrate(input: {
		id: string;
		orderId: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
	}): PaymentIntent {
		return new PaymentIntent(
			input.id,
			input.orderId,
			input.amount,
			input.currency,
			input.status,
		);
	}

	markSucceeded(): void {
		if (this._status !== PaymentStatus.PENDING) {
			throw DomainErrorFactory.create(
				PAYMENTS_DOMAIN_ERRORS.PAYMENT_MARK_SUCCEEDED_INVALID_STATUS,
				{
					message: `cannot mark payment succeeded when status is ${this._status}`,
					details: { status: this._status },
				},
			);
		}
		this._status = PaymentStatus.SUCCEEDED;
	}

	markFailed(): void {
		if (this._status !== PaymentStatus.PENDING) {
			throw DomainErrorFactory.create(
				PAYMENTS_DOMAIN_ERRORS.PAYMENT_MARK_FAILED_INVALID_STATUS,
				{
					message: `cannot mark payment failed when status is ${this._status}`,
					details: { status: this._status },
				},
			);
		}
		this._status = PaymentStatus.FAILED;
	}

	get orderId(): string {
		return this._orderId;
	}

	get amount(): number {
		return this._amount;
	}

	get currency(): string {
		return this._currency;
	}

	get status(): PaymentStatus {
		return this._status;
	}

	toPrimitives(): {
		paymentId: string;
		orderId: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
	} {
		return {
			paymentId: this.id,
			orderId: this._orderId,
			amount: this._amount,
			currency: this._currency,
			status: this._status,
		};
	}
}

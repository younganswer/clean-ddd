import { PaymentStatus } from '@/shared/payments';

export class PaymentIntent {
	private constructor(
		private readonly _id: string,
		private readonly _orderId: string,
		private readonly _amount: number,
		private readonly _currency: string,
		private _status: PaymentStatus,
		private readonly _createdAt: Date,
		private _updatedAt: Date,
	) {}

	static createPending(input: {
		id: string;
		orderId: string;
		amount: number;
		currency: string;
		now?: Date;
	}): PaymentIntent {
		const now = input.now ?? new Date();
		return new PaymentIntent(
			input.id,
			input.orderId,
			input.amount,
			input.currency,
			PaymentStatus.PENDING,
			now,
			now,
		);
	}

	static rehydrate(input: {
		id: string;
		orderId: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
		createdAt: Date;
		updatedAt: Date;
	}): PaymentIntent {
		return new PaymentIntent(
			input.id,
			input.orderId,
			input.amount,
			input.currency,
			input.status,
			input.createdAt,
			input.updatedAt,
		);
	}

	get id(): string {
		return this._id;
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

	get createdAt(): Date {
		return this._createdAt;
	}

	get updatedAt(): Date {
		return this._updatedAt;
	}

	toPrimitives(): {
		paymentId: string;
		orderId: string;
		amount: number;
		currency: string;
		status: PaymentStatus;
		createdAt: Date;
		updatedAt: Date;
	} {
		return {
			paymentId: this._id,
			orderId: this._orderId,
			amount: this._amount,
			currency: this._currency,
			status: this._status,
			createdAt: this._createdAt,
			updatedAt: this._updatedAt,
		};
	}
}

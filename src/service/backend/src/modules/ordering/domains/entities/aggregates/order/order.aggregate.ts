import { OrderStatus } from '@/modules/ordering/domains/enums/order-status.enum';
import { BaseEntity } from '@/common/domain/base.entity';
import { Money } from '@/shared/money/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { ORDERING_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';
import { randomUUID } from 'node:crypto';

export class Order extends BaseEntity {
	private constructor(
		id: string,
		private readonly _userId: string,
		private readonly _total: Money,
		private readonly _items: OrderItem[],
		private readonly _orderedAt: Date,
		private _status: OrderStatus,
		private _paymentId: string | null,
		private _paidAt: Date | null,
	) {
		super(id);
	}

	static create(input: {
		userId: string;
		total: Money;
		items: OrderItem[];
		now?: Date;
	}): Order {
		const userId = String(input.userId ?? '').trim();

		if (!userId) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_USER_ID_REQUIRED,
			);
		}

		if (!Array.isArray(input.items) || input.items.length === 0) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_ITEMS_REQUIRED,
			);
		}

		return new Order(
			randomUUID(),
			userId,
			input.total,
			[...input.items],
			input.now ?? new Date(),
			OrderStatus.PENDING_PAYMENT,
			null,
			null,
		);
	}

	static rehydrate(input: {
		uuid: string;
		userId: string;
		total: Money;
		items: OrderItem[];
		orderedAt: Date;
		status: OrderStatus;
		paymentId: string | null;
		paidAt: Date | null;
	}): Order {
		return new Order(
			input.uuid,
			input.userId,
			input.total,
			input.items,
			input.orderedAt,
			input.status,
			input.paymentId,
			input.paidAt,
		);
	}

	attachPayment(paymentId: string): void {
		const normalized = String(paymentId ?? '').trim();

		if (!normalized) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_PAYMENT_ID_REQUIRED,
			);
		}

		if (this._status !== OrderStatus.PENDING_PAYMENT) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_PAYMENT_ATTACH_INVALID_STATUS,
				{
					message: `cannot attach payment when order is ${this._status}`,
					details: { status: this._status },
				},
			);
		}

		if (this._paymentId && this._paymentId !== normalized) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_PAYMENT_ALREADY_ATTACHED,
			);
		}

		this._paymentId = normalized;
	}

	markPaid(): void {
		// idempotent
		if (this._status === OrderStatus.PAID) {
			return;
		}

		if (this._status !== OrderStatus.PENDING_PAYMENT) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_MARK_PAID_INVALID_STATUS,
				{
					message: `cannot mark paid when order is ${this._status}`,
					details: { status: this._status },
				},
			);
		}

		if (!this._paymentId) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_PAYMENT_NOT_ATTACHED,
			);
		}

		this._status = OrderStatus.PAID;
		this._paidAt = new Date();
	}

	get userId(): string {
		return this._userId;
	}

	get amount(): number {
		return this._total.amount;
	}

	get currency(): string {
		return this._total.currency;
	}

	get total(): Money {
		return this._total;
	}

	get items(): OrderItem[] {
		return [...this._items];
	}

	get orderedAt(): Date {
		return new Date(this._orderedAt);
	}

	get status(): OrderStatus {
		return this._status;
	}

	get paymentId(): string | null {
		return this._paymentId;
	}

	get paidAt(): Date | null {
		return this._paidAt ? new Date(this._paidAt) : null;
	}

	toPrimitives(): {
		orderId: string;
		userId: string;
		total: { amount: number; currency: string };
		items: Array<{ sku: string; quantity: number }>;
		orderedAt: Date;
		status: OrderStatus;
		paymentId: string | null;
		paidAt: Date | null;
	} {
		return {
			orderId: this.id,
			userId: this._userId,
			total: this._total.toPrimitives(),
			items: this._items.map((item) => item.toPrimitives()),
			orderedAt: this._orderedAt,
			status: this._status,
			paymentId: this._paymentId,
			paidAt: this._paidAt,
		};
	}
}

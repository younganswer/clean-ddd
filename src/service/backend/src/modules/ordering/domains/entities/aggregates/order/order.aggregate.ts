import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { BaseEntity } from '@/shared/domain/base.entity';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { ORDERING_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';
import { randomUUID } from 'node:crypto';

export class Order extends BaseEntity {
	private constructor(
		id: string,
		private readonly _userId: string,
		private _status: OrderStatus,
		private readonly _total: Money,
		private readonly _items: OrderItem[],
		private _paymentId: string | null,
		private readonly _orderedAt: Date,
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
			OrderStatus.PENDING_PAYMENT,
			input.total,
			[...input.items],
			null,
			input.now ?? new Date(),
			null,
		);
	}

	static rehydrate(input: {
		uuid: string;
		userId: string;
		status: OrderStatus;
		total: Money;
		items: OrderItem[];
		paymentId: string | null;
		orderedAt: Date;
		paidAt: Date | null;
	}): Order {
		return new Order(
			input.uuid,
			input.userId,
			input.status,
			input.total,
			input.items,
			input.paymentId,
			input.orderedAt,
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

	get status(): OrderStatus {
		return this._status;
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

	get items(): Array<{ sku: string; quantity: number }> {
		return this._items.map((i) => i.toPrimitives());
	}

	get paymentId(): string | null {
		return this._paymentId;
	}

	get orderedAt(): Date {
		return this._orderedAt;
	}

	get paidAt(): Date | null {
		return this._paidAt;
	}

	toPrimitives(): {
		orderId: string;
		userId: string;
		status: OrderStatus;
		total: Money;
		items: OrderItem[];
		paymentId: string | null;
		orderedAt: Date;
		paidAt: Date | null;
	} {
		return {
			orderId: this.id,
			userId: this._userId,
			status: this._status,
			total: this._total,
			items: [...this._items],
			paymentId: this._paymentId,
			orderedAt: this._orderedAt,
			paidAt: this._paidAt,
		};
	}
}

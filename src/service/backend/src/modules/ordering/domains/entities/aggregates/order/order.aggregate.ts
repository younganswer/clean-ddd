import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { BaseEntity } from '@/shared/domain/base.entity';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';
import { randomUUID } from 'node:crypto';

export class Order extends BaseEntity {
	private constructor(
		uuid: string,
		private readonly _userId: string,
		private _status: OrderStatus,
		private readonly _total: Money,
		private readonly _items: OrderItem[],
		private _paymentId: string | null,
		private readonly _orderedAt: Date,
		private _paidAt: Date | null,
	) {
		super(uuid);
	}

	static create(input: {
		userId: string;
		total: Money;
		items: OrderItem[];
		now?: Date;
	}): Order {
		return new Order(
			randomUUID(),
			input.userId,
			OrderStatus.PENDING_PAYMENT,
			input.total,
			input.items,
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
		if (!normalized) throw new Error('paymentId is required');

		this._paymentId = normalized;
	}

	markPaid(): void {
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
			orderId: this.uuid,
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

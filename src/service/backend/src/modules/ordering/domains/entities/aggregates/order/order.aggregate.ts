import { OrderStatus } from '@/shared/ordering/enums/order-status.enum';
import { BaseEntity } from '@/shared/domain/base.entity';
import { Money } from '@/modules/ordering/domains/value-objects/money.vo';
import { OrderItem } from '@/modules/ordering/domains/value-objects/order-item.vo';

export class Order extends BaseEntity {
  private constructor(
    id: number,
    uuid: string,
    private readonly _userId: string,
    private _status: OrderStatus,
    private readonly _total: Money,
    private readonly _items: OrderItem[],
    private _paymentId: string | null,
    private readonly _createdAt: Date,
    private _updatedAt: Date,
  ) {
    super(id, uuid);
  }

  static createNew(input: {
    id: number;
    uuid: string;
    userId: string;
    total: Money;
    items: OrderItem[];
    now?: Date;
  }): Order {
    const now = input.now ?? new Date();
    return new Order(
      input.id,
      input.uuid,
      input.userId,
      OrderStatus.PENDING_PAYMENT,
      input.total,
      input.items,
      null,
      now,
      now,
    );
  }

  static rehydrate(input: {
    id: number;
    uuid: string;
    userId: string;
    status: OrderStatus;
    total: Money;
    items: OrderItem[];
    paymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): Order {
    return new Order(
      input.id,
      input.uuid,
      input.userId,
      input.status,
      input.total,
      input.items,
      input.paymentId,
      input.createdAt,
      input.updatedAt,
    );
  }

  attachPayment(paymentId: string, now: Date = new Date()): void {
    const normalized = String(paymentId ?? '').trim();
    if (!normalized) throw new Error('paymentId is required');

    this._paymentId = normalized;
    this._updatedAt = now;
  }

  markPaid(now: Date = new Date()): void {
    this._status = OrderStatus.PAID;
    this._updatedAt = now;
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

  get createdAt(): Date {
    return this._createdAt;
  }

  get updatedAt(): Date {
    return this._updatedAt;
  }

  toPrimitives(): {
    id: number;
    uuid: string;
    userId: string;
    status: OrderStatus;
    amount: number;
    currency: string;
    items: Array<{ sku: string; quantity: number }>;
    paymentId: string | null;
    createdAt: Date;
    updatedAt: Date;
  } {
    return {
      id: this.id,
      uuid: this.uuid,
      userId: this._userId,
      status: this._status,
      amount: this.amount,
      currency: this.currency,
      items: this.items,
      paymentId: this._paymentId,
      createdAt: this._createdAt,
      updatedAt: this._updatedAt,
    };
  }
}

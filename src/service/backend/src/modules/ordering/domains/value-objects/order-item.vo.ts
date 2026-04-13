import {
	OrderingItemQuantityInvalidException,
	OrderingItemSkuRequiredException,
} from '@/shared/exceptions';
import { DomainExceptionFactory } from '@/common/exceptions/base.exception-factory';

export class OrderItem {
	private constructor(
		private readonly _sku: string,
		private readonly _quantity: number,
	) {}

	static of(sku: string, quantity: number): OrderItem {
		const normalizedSku = String(sku ?? '').trim();
		const normalizedQuantity = Number(quantity);

		if (!normalizedSku) {
			throw DomainExceptionFactory.create(
				OrderingItemSkuRequiredException,
			);
		}
		if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
			throw DomainExceptionFactory.create(
				OrderingItemQuantityInvalidException,
				{
					cause: { quantity },
				},
			);
		}

		return new OrderItem(normalizedSku, normalizedQuantity);
	}

	get sku(): string {
		return this._sku;
	}

	get quantity(): number {
		return this._quantity;
	}

	toPrimitives(): { sku: string; quantity: number } {
		return { sku: this._sku, quantity: this._quantity };
	}
}

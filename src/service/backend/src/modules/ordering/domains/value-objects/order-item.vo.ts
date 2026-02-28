import { ORDERING_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/shared/errors/base.error-factory';

export class OrderItem {
	private constructor(
		private readonly _sku: string,
		private readonly _quantity: number,
	) {}

	static of(sku: string, quantity: number): OrderItem {
		const normalizedSku = String(sku ?? '').trim();
		const normalizedQuantity = Number(quantity);

		if (!normalizedSku) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_ITEM_SKU_REQUIRED,
			);
		}
		if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.ORDER_ITEM_QUANTITY_INVALID,
				{
					details: { quantity },
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

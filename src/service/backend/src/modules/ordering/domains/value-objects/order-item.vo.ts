export class OrderItem {
	private constructor(
		private readonly _sku: string,
		private readonly _quantity: number,
	) {}

	static of(sku: string, quantity: number): OrderItem {
		const normalizedSku = String(sku ?? '').trim();
		const normalizedQuantity = Number(quantity);

		if (!normalizedSku) {
			throw new Error('sku is required');
		}
		if (!Number.isFinite(normalizedQuantity) || normalizedQuantity <= 0) {
			throw new Error('quantity must be a positive number');
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

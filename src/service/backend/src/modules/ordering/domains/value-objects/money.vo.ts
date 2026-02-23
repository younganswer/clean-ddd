export class Money {
	private constructor(
		private readonly _amount: number,
		private readonly _currency: string,
	) {}

	static of(amount: number, currency: string): Money {
		const normalizedCurrency = String(currency ?? '').toUpperCase();
		const normalizedAmount = Number(amount);

		if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
			throw new Error('amount must be a positive number');
		}
		if (!normalizedCurrency) {
			throw new Error('currency is required');
		}

		return new Money(normalizedAmount, normalizedCurrency);
	}

	get amount(): number {
		return this._amount;
	}

	get currency(): string {
		return this._currency;
	}

	toPrimitives(): { amount: number; currency: string } {
		return { amount: this._amount, currency: this._currency };
	}
}

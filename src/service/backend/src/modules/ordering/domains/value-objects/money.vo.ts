import { ORDERING_DOMAIN_ERRORS } from '@/shared/errors';
import { DomainErrorFactory } from '@/common/errors/base.error-factory';

export class Money {
	private constructor(
		private readonly _amount: number,
		private readonly _currency: string,
	) {}

	static of(amount: number, currency: string): Money {
		const normalizedCurrency = String(currency ?? '').toUpperCase();
		const normalizedAmount = Number(amount);

		if (!Number.isFinite(normalizedAmount) || normalizedAmount <= 0) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.MONEY_AMOUNT_INVALID,
				{
					details: { amount },
				},
			);
		}
		if (!normalizedCurrency) {
			throw DomainErrorFactory.create(
				ORDERING_DOMAIN_ERRORS.MONEY_CURRENCY_REQUIRED,
			);
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

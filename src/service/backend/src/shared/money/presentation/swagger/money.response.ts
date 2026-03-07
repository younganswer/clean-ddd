import { ApiProperty } from '@nestjs/swagger';
import type { MoneyResult } from '@/shared/money/application/results/money.result';

export class MoneyResponse {
	@ApiProperty()
	currency!: string;

	@ApiProperty()
	amountMinor!: number;

	static fromResult(result: MoneyResult): MoneyResponse {
		return {
			currency: result.currency,
			amountMinor: result.amountMinor,
		};
	}

	static fromAmountMinor(
		amountMinor: number,
		currency: string,
	): MoneyResponse {
		return {
			currency,
			amountMinor,
		};
	}
}

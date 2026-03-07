import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoundedInt,
	toNonNegativeInt,
} from '@/common/cqrs/input-normalizer';

export class GetOrdersByUserIdQuery extends Query<OrderResult[]> {
	public readonly userId: string;
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { userId: string; limit?: number; offset?: number }) {
		super();
		this.userId = requireTrimmedString(
			input.userId,
			USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
			{ reason: 'userId' },
		);
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 200,
			fallback: 200,
		});
		this.offset = toNonNegativeInt(input.offset, 0);
	}
}

import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import {
	requireTrimmedString,
	toBoundedInt,
	toNonNegativeInt,
} from '@/shared/cqrs/input-normalizer';

export class ListOrdersByUserIdQuery extends Query<OrderResult[]> {
	public readonly userId: string;

	public readonly limit: number;

	public readonly offset: number;

	constructor(userId: string, limit: number = 200, offset: number = 0) {
		super();
		this.userId = requireTrimmedString(
			userId,
			USER_APPLICATION_ERRORS.USER_ID_REQUIRED,
			{ reason: 'userId' },
		);
		this.limit = toBoundedInt(limit, {
			min: 1,
			max: 200,
			fallback: 200,
		});
		this.offset = toNonNegativeInt(offset, 0);
	}
}

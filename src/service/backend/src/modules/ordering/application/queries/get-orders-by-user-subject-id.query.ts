import { Query } from '@nestjs/cqrs';
import type { OrderResult } from '@/modules/ordering/domain/readers/order.result';
import { UserApplicationUserIdRequiredException } from '@/shared/exceptions';
import {
	toTrimmedString,
	toBoundedInt,
	toNonNegativeInt,
} from '@/common/cqrs/input-normalizer';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

export class GetOrdersByUserIdQuery extends Query<OrderResult[]> {
	public readonly userId: string;
	public readonly limit: number;
	public readonly offset: number;

	constructor(input: { userId: string; limit?: number; offset?: number }) {
		super();
		const userId = toTrimmedString(input.userId);
		if (!userId) {
			throw ApplicationExceptionFactory.create(
				UserApplicationUserIdRequiredException,
				{ description: 'userId' },
			);
		}

		this.userId = userId;
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 200,
			fallback: 200,
		});
		this.offset = toNonNegativeInt(input.offset, 0);
	}
}

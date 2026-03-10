import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { OrderDetailBffResponse } from '@/bff/order-detail/presentation/swagger/order-detail.response';

import { GetOrderDetailBffQuery } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import { GetOrderDetailBffQueryDto } from '@/bff/order-detail/presentation/order-detail-bff.dto';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/common/errors/base.error-factory';

@Controller('bff/order-detail')
export class OrderDetailBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get(':orderId')
	@ApiDataResponse({ model: OrderDetailBffResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('orderId') orderId: string,
		@Query() query: GetOrderDetailBffQueryDto,
	): Promise<DataEnvelope<OrderDetailBffResponse>> {
		const result = await this.queryBus.execute(
			new GetOrderDetailBffQuery({
				orderId,
				...query,
			}),
		);
		if (!result)
			throw ApplicationErrorFactory.create(
				ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
			);
		const response = OrderDetailBffResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}

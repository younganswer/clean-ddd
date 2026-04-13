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
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

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
		const getOrderDetailBffQuery = new GetOrderDetailBffQuery({
			orderId,
			...query,
		});
		const result = await this.queryBus.execute(getOrderDetailBffQuery);
		if (!result)
			throw ApplicationExceptionFactory.create(
				OrderingOrderNotFoundException,
			);
		const response = OrderDetailBffResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}

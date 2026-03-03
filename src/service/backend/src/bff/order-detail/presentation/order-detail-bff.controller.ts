import {
	Controller,
	Get,
	NotFoundException,
	Param,
	Query,
} from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { OrderDetailBffResponseDto } from '@/bff/order-detail/presentation/swagger';

import { GetOrderDetailBffQuery } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import type { OrderDetailBffView } from '@/bff/order-detail/application/queries/get-order-detail-bff.query';
import { GetOrderDetailBffQueryDto } from '@/bff/order-detail/presentation/order-detail-bff.dto';

@Controller('bff/order-detail')
export class OrderDetailBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get(':orderId')
	@ApiDataResponse({ model: OrderDetailBffResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('orderId') orderId: string,
		@Query() query: GetOrderDetailBffQueryDto,
	): Promise<DataResponse<OrderDetailBffView>> {
		const result = await this.queryBus.execute<
			GetOrderDetailBffQuery,
			OrderDetailBffView | null
		>(
			new GetOrderDetailBffQuery({
				orderId,
				includePayment: query.includePayment,
				includeShipment: query.includeShipment,
				includeReservations: query.includeReservations,
			}),
		);

		if (!result) throw new NotFoundException('order not found');
		return DataResponse.of(result);
	}
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse, PageResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { executeQuery } from '@/common/utils/cqrs-executor';
import { ShipmentResponseDto } from '@/modules/shipping/presentation/swagger';
import {
	GetShipmentByOrderQuery,
	GetShipmentQuery,
	ListShipmentsQuery,
	type ShipmentView,
} from '@/shared/shipping';
import type { PaginatedView } from '@/shared/readers/paginated.view';

@Controller('shipments')
export class ShipmentsController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: ShipmentResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<ShipmentView>> {
		const limit = Math.min(Math.max(Number(limitRaw ?? 20) || 20, 1), 100);
		const page = Math.max(1, Number(pageRaw ?? 1) || 1);
		const result = await executeQuery<PaginatedView<ShipmentView>>(
			this.queryBus,
			new ListShipmentsQuery(limit, page),
		);
		return PageResponse.from(result);
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataResponse<ShipmentView | null>> {
		const result = await executeQuery<ShipmentView | null>(
			this.queryBus,
			new GetShipmentByOrderQuery(orderId),
		);
		return DataResponse.of(result);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataResponse<ShipmentView | null>> {
		const result = await executeQuery<ShipmentView | null>(
			this.queryBus,
			new GetShipmentQuery(id),
		);
		return DataResponse.of(result);
	}
}

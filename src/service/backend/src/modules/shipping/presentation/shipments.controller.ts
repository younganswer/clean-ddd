import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse, PageResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
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
		const result = await this.queryBus.execute<
			ListShipmentsQuery,
			PaginatedView<ShipmentView>
		>(new ListShipmentsQuery(Number(limitRaw), Number(pageRaw)));
		return PageResponse.from(result);
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataResponse<ShipmentView | null>> {
		const result = await this.queryBus.execute<
			GetShipmentByOrderQuery,
			ShipmentView | null
		>(new GetShipmentByOrderQuery(orderId));
		return DataResponse.of(result);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataResponse<ShipmentView | null>> {
		const result = await this.queryBus.execute<
			GetShipmentQuery,
			ShipmentView | null
		>(new GetShipmentQuery(id));
		return DataResponse.of(result);
	}
}

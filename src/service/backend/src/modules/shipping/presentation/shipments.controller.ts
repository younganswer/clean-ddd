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
	type ShipmentResult,
} from '@/shared/shipping';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@Controller('shipments')
export class ShipmentsController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: ShipmentResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<ShipmentResult>> {
		const result = await this.queryBus.execute<
			ListShipmentsQuery,
			PaginatedResult<ShipmentResult>
		>(new ListShipmentsQuery(Number(limitRaw), Number(pageRaw)));
		return PageResponse.from(result);
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataResponse<ShipmentResult | null>> {
		const result = await this.queryBus.execute<
			GetShipmentByOrderQuery,
			ShipmentResult | null
		>(new GetShipmentByOrderQuery(orderId));
		return DataResponse.of(result);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataResponse<ShipmentResult | null>> {
		const result = await this.queryBus.execute<
			GetShipmentQuery,
			ShipmentResult | null
		>(new GetShipmentQuery(id));
		return DataResponse.of(result);
	}
}

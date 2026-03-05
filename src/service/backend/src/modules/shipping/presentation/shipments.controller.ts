import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { ShipmentResponse } from '@/modules/shipping/presentation/swagger';
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
	@ApiPageResponse({ model: ShipmentResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageEnvelope<ShipmentResponse>> {
		const result = await this.queryBus.execute<
			ListShipmentsQuery,
			PaginatedResult<ShipmentResult>
		>(new ListShipmentsQuery(Number(limitRaw), Number(pageRaw)));
		return ResponseHelper.page({
			...result,
			items: ShipmentResponse.fromResults(result.items),
		});
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const result = await this.queryBus.execute<
			GetShipmentByOrderQuery,
			ShipmentResult | null
		>(new GetShipmentByOrderQuery(orderId));
		return ResponseHelper.data(
			result ? ShipmentResponse.fromResult(result) : null,
		);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const result = await this.queryBus.execute<
			GetShipmentQuery,
			ShipmentResult | null
		>(new GetShipmentQuery(id));
		return ResponseHelper.data(
			result ? ShipmentResponse.fromResult(result) : null,
		);
	}
}

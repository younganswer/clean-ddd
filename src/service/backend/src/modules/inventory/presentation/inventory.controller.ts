import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse, ListResponse, PageResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
	ApiPageResponse,
} from '@/common/swagger';
import {
	InventoryItemResponseDto,
	InventoryReservationResponseDto,
} from '@/modules/inventory/presentation/swagger';
import {
	GetInventoryItemQuery,
	type InventoryItemResult,
	ListInventoryItemsQuery,
	ListInventoryReservationsQuery,
	type InventoryReservationResult,
} from '@/shared/inventory';
import type { PaginatedResult } from '@/shared/readers/paginated.result';

@Controller('inventory')
export class InventoryController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('items')
	@ApiPageResponse({ model: InventoryItemResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listItems(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<InventoryItemResult>> {
		const result = await this.queryBus.execute<
			ListInventoryItemsQuery,
			PaginatedResult<InventoryItemResult>
		>(new ListInventoryItemsQuery(Number(limitRaw), Number(pageRaw)));
		return PageResponse.from(result);
	}

	@Get('items/:sku')
	@ApiDataResponse({ model: InventoryItemResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async getItem(
		@Param('sku') sku: string,
	): Promise<DataResponse<InventoryItemResult | null>> {
		const result = await this.queryBus.execute<
			GetInventoryItemQuery,
			InventoryItemResult | null
		>(new GetInventoryItemQuery(sku));
		return DataResponse.of(result);
	}

	@Get('reservations')
	@ApiListResponse({ model: InventoryReservationResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listReservations(
		@Query('orderId') orderId?: string,
	): Promise<ListResponse<InventoryReservationResult>> {
		const result = await this.queryBus.execute<
			ListInventoryReservationsQuery,
			InventoryReservationResult[]
		>(new ListInventoryReservationsQuery(String(orderId)));
		return ListResponse.from(result);
	}
}

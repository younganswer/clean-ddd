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
	type InventoryItemView,
	ListInventoryItemsQuery,
	ListInventoryReservationsQuery,
	type InventoryReservationView,
} from '@/shared/inventory';
import type { PaginatedView } from '@/shared/readers/paginated.view';

@Controller('inventory')
export class InventoryController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('items')
	@ApiPageResponse({ model: InventoryItemResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listItems(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<InventoryItemView>> {
		const result = await this.queryBus.execute<
			ListInventoryItemsQuery,
			PaginatedView<InventoryItemView>
		>(new ListInventoryItemsQuery(Number(limitRaw), Number(pageRaw)));
		return PageResponse.from(result);
	}

	@Get('items/:sku')
	@ApiDataResponse({ model: InventoryItemResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async getItem(
		@Param('sku') sku: string,
	): Promise<DataResponse<InventoryItemView | null>> {
		const result = await this.queryBus.execute<
			GetInventoryItemQuery,
			InventoryItemView | null
		>(new GetInventoryItemQuery(sku));
		return DataResponse.of(result);
	}

	@Get('reservations')
	@ApiListResponse({ model: InventoryReservationResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listReservations(
		@Query('orderId') orderId?: string,
	): Promise<ListResponse<InventoryReservationView>> {
		const result = await this.queryBus.execute<
			ListInventoryReservationsQuery,
			InventoryReservationView[]
		>(new ListInventoryReservationsQuery(String(orderId)));
		return ListResponse.from(result);
	}
}

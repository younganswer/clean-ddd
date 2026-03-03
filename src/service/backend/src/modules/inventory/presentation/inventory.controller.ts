import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse, ListResponse, PageResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { executeQuery } from '@/common/utils/cqrs-executor';
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
		const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
		const page = Math.max(1, Number(pageRaw ?? 1) || 1);
		const result = await executeQuery<PaginatedView<InventoryItemView>>(
			this.queryBus,
			new ListInventoryItemsQuery(limit, page),
		);
		return PageResponse.from(result);
	}

	@Get('items/:sku')
	@ApiDataResponse({ model: InventoryItemResponseDto, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async getItem(
		@Param('sku') sku: string,
	): Promise<DataResponse<InventoryItemView | null>> {
		const result = await executeQuery<InventoryItemView | null>(
			this.queryBus,
			new GetInventoryItemQuery(sku),
		);
		return DataResponse.of(result);
	}

	@Get('reservations')
	@ApiListResponse({ model: InventoryReservationResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listReservations(
		@Query('orderId') orderId?: string,
	): Promise<ListResponse<InventoryReservationView>> {
		const id = String(orderId ?? '');
		if (!id) return ListResponse.from([]);
		const result = await executeQuery<InventoryReservationView[]>(
			this.queryBus,
			new ListInventoryReservationsQuery(id),
		);
		return ListResponse.from(result);
	}
}

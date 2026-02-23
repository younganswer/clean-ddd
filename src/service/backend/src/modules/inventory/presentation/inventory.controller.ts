import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { executeQuery } from '@/common/utils/cqrs-executor';
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
	async listItems(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PaginatedView<InventoryItemView>> {
		const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
		const page = Math.max(1, Number(pageRaw ?? 1) || 1);
		return await executeQuery(
			this.queryBus,
			new ListInventoryItemsQuery(limit, page),
		);
	}

	@Get('items/:sku')
	async getItem(
		@Param('sku') sku: string,
	): Promise<InventoryItemView | null> {
		return await executeQuery(
			this.queryBus,
			new GetInventoryItemQuery(sku),
		);
	}

	@Get('reservations')
	async listReservations(
		@Query('orderId') orderId?: string,
	): Promise<InventoryReservationView[]> {
		const id = String(orderId ?? '');
		if (!id) return [];
		return await executeQuery(
			this.queryBus,
			new ListInventoryReservationsQuery(id),
		);
	}
}

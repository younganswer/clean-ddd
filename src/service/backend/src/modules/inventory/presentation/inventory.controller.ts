import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import {
	DataEnvelope,
	ListEnvelope,
	PageEnvelope,
	ResponseHelper,
} from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
	ApiPageResponse,
} from '@/common/swagger/api-response.decorator';
import {
	InventoryItemResponse,
	InventoryReservationResponse,
} from '@/modules/inventory/presentation/swagger/inventory.response';
import { GetInventoryItemQuery } from '@/modules/inventory/application/queries/get-inventory-item.query';
import { GetInventoryItemsQuery } from '@/modules/inventory/application/queries/get-inventory-items.query';
import { GetInventoryReservationsQuery } from '@/modules/inventory/application/queries/get-inventory-reservations.query';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';

@Controller('inventory')
export class InventoryController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('items')
	@ApiPageResponse({ model: InventoryItemResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listItems(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<InventoryItemResponse>> {
		const getInventoryItemsQuery = new GetInventoryItemsQuery({
			limit: query.limit,
			offset: query.offset,
		});
		const result = await this.queryBus.execute(getInventoryItemsQuery);
		const response = InventoryItemResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}

	@Get('items/:sku')
	@ApiDataResponse({ model: InventoryItemResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async getItem(
		@Param('sku') sku: string,
	): Promise<DataEnvelope<InventoryItemResponse | null>> {
		const getInventoryItemQuery = new GetInventoryItemQuery({ sku });
		const result = await this.queryBus.execute(getInventoryItemQuery);
		const response = result
			? InventoryItemResponse.fromResult(result)
			: null;

		return ResponseHelper.data(response);
	}

	@Get('reservations')
	@ApiListResponse({ model: InventoryReservationResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async listReservations(
		@Query('orderId') orderId: string,
	): Promise<ListEnvelope<InventoryReservationResponse>> {
		const getInventoryReservationsQuery = new GetInventoryReservationsQuery(
			{ orderId },
		);
		const result = await this.queryBus.execute(
			getInventoryReservationsQuery,
		);
		const response = InventoryReservationResponse.fromResults(result);

		return ResponseHelper.list(response);
	}
}

import { Controller, Get, Param, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger/api-response.decorator';
import { ShipmentResponse } from '@/modules/shipping/presentation/swagger/shipping.response';
import { GetShipmentByOrderQuery } from '@/modules/shipping/application/queries/get-shipment-by-order.query';
import { GetShipmentQuery } from '@/modules/shipping/application/queries/get-shipment.query';
import { GetShipmentsQuery } from '@/modules/shipping/application/queries/get-shipments.query';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';

@Controller('shipments')
export class ShipmentsController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get()
	@ApiPageResponse({ model: ShipmentResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<ShipmentResponse>> {
		const getShipmentsQuery = new GetShipmentsQuery({
			limit: query.limit,
			offset: query.offset,
		});
		const result = await this.queryBus.execute(getShipmentsQuery);
		const response = ShipmentResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const getShipmentByOrderQuery = new GetShipmentByOrderQuery({
			orderId,
		});
		const result = await this.queryBus.execute(getShipmentByOrderQuery);
		const response = result ? ShipmentResponse.fromResult(result) : null;

		return ResponseHelper.data(response);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const getShipmentQuery = new GetShipmentQuery({ shipmentId: id });
		const result = await this.queryBus.execute(getShipmentQuery);
		const response = result ? ShipmentResponse.fromResult(result) : null;

		return ResponseHelper.data(response);
	}
}

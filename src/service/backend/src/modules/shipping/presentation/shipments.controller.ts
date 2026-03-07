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
	GetShipmentsQuery,
} from '@/shared/shipping';
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
		const result = await this.queryBus.execute(
			new GetShipmentsQuery({
				limit: query.limit ?? Number.NaN,
				offset: query.offset ?? Number.NaN,
			}),
		);
		const response = ShipmentResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}

	@Get('by-order/:orderId')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async byOrder(
		@Param('orderId') orderId: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const result = await this.queryBus.execute(
			new GetShipmentByOrderQuery({ orderId }),
		);
		const response = result ? ShipmentResponse.fromResult(result) : null;

		return ResponseHelper.data(response);
	}

	@Get(':id')
	@ApiDataResponse({ model: ShipmentResponse, nullable: true })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async get(
		@Param('id') id: string,
	): Promise<DataEnvelope<ShipmentResponse | null>> {
		const result = await this.queryBus.execute(
			new GetShipmentQuery({ shipmentId: id }),
		);
		const response = result ? ShipmentResponse.fromResult(result) : null;

		return ResponseHelper.data(response);
	}
}

import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import {
	CreateOrderResponse,
	OrderResponse,
} from '@/bff/orders/presentation/swagger';

import { CreateOrderBffBodyDto } from '@/bff/orders/presentation/orders-bff.dto';
import { CreateOrderBffCommand } from '@/bff/orders/application/commands/create-order-bff.command';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';
import { GetOrdersBffQuery } from '@/bff/orders/application/queries/get-orders-bff.query';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';
import { PageQueryDto } from '@/shared/cqrs/query-input.dto';

@Controller('bff/orders')
export class OrdersBffController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	@ApiPageResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<OrderResponse>> {
		const result = await this.queryBus.execute(
			new GetOrdersBffQuery(query),
		);
		const response = OrderResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}

	@Get(':orderId')
	@ApiDataResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('orderId') orderId: string,
	): Promise<DataEnvelope<OrderResponse>> {
		const order = await this.queryBus.execute(
			new GetOrderBffQuery({ orderId }),
		);
		if (!order)
			throw ApplicationErrorFactory.create(
				ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
			);
		const response = OrderResponse.fromResult(order);

		return ResponseHelper.data(response);
	}

	@Post()
	@ApiDataResponse({ model: CreateOrderResponse }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateOrderBffBodyDto,
	): Promise<DataEnvelope<CreateOrderResponse>> {
		const result = await this.commandBus.execute(
			new CreateOrderBffCommand(body),
		);
		const response = CreateOrderResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}

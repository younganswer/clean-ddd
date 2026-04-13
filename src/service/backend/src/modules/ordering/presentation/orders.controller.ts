import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger/api-response.decorator';
import { CreateOrderCommand } from '@/modules/ordering/application/commands/create-order.command';
import { GetOrderQuery } from '@/modules/ordering/application/queries/get-order.query';
import { GetOrdersQuery } from '@/modules/ordering/application/queries/get-orders.query';
import { isOrderResult } from '@/modules/ordering/domains/readers/order-result.guard';
import { CreateOrderRequest } from '@/modules/ordering/presentation/dto/create-order.request';
import {
	CreateOrderResponse,
	OrderResponse,
} from '@/modules/ordering/presentation/swagger/orders.response';
import { PageQueryDto } from '@/common/cqrs/query-input.dto';
import { OrderingOrderNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
	@ApiDataResponse({ model: CreateOrderResponse }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateOrderRequest,
	): Promise<DataEnvelope<CreateOrderResponse>> {
		const command = new CreateOrderCommand(body);
		const result = await this.commandBus.execute(command);
		const response = CreateOrderResponse.fromResult(result);

		return ResponseHelper.data(response);
	}

	@Get()
	@ApiPageResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<OrderResponse>> {
		const queryCommand = new GetOrdersQuery({
			limit: query.limit,
			offset: query.offset,
		});
		const result = await this.queryBus.execute(queryCommand);
		const response = OrderResponse.fromPaginatedResults(result);

		return ResponseHelper.page(response);
	}

	@Get(':id')
	@ApiDataResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(@Param('id') id: string): Promise<DataEnvelope<OrderResponse>> {
		const getOrderCommand = new GetOrderQuery({ orderId: id });
		const order = await this.queryBus.execute(getOrderCommand);
		if (!isOrderResult(order))
			throw ApplicationExceptionFactory.create(
				OrderingOrderNotFoundException,
			);
		const response = OrderResponse.fromResult(order);

		return ResponseHelper.data(response);
	}
}

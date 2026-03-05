import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { GetOrdersQuery } from '@/shared/ordering/queries/get-orders.query';
import { isOrderResult } from '@/shared/ordering/readers/order-result.guard';
import { CreateOrderRequest } from '@/modules/ordering/presentation/dto/create-order.request';
import {
	CreateOrderResponse,
	OrderResponse,
} from '@/modules/ordering/presentation/swagger';
import { PageQueryDto } from '@/shared/cqrs/query-input.dto';
import { ORDERING_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

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
		const result = await this.commandBus.execute(
			new CreateOrderCommand(body),
		);
		const response = CreateOrderResponse.fromResult(result);

		return ResponseHelper.data(response);
	}

	@Get()
	@ApiPageResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: PageQueryDto,
	): Promise<PageEnvelope<OrderResponse>> {
		const result = await this.queryBus.execute(
			new GetOrdersQuery({
				limit: query.limit ?? Number.NaN,
				offset: query.offset ?? Number.NaN,
			}),
		);

		return ResponseHelper.page({
			...result,
			items: OrderResponse.fromResults(result.items),
		});
	}

	@Get(':id')
	@ApiDataResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(@Param('id') id: string): Promise<DataEnvelope<OrderResponse>> {
		const order = await this.queryBus.execute(
			new GetOrderQuery({ orderId: id }),
		);
		if (!isOrderResult(order))
			throw ApplicationErrorFactory.create(
				ORDERING_APPLICATION_ERRORS.ORDER_NOT_FOUND,
			);
		const response = OrderResponse.fromResult(order);

		return ResponseHelper.data(response);
	}
}

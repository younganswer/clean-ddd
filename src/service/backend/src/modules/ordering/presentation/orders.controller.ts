import {
	Body,
	Controller,
	Get,
	NotFoundException,
	Param,
	Post,
	Query,
} from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, PageEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import type { OrderResult } from '@/shared/ordering/readers/order.result';
import { isOrderResult } from '@/shared/ordering/readers/order-result.guard';
import { CreateOrderRequest } from '@/modules/ordering/presentation/dto/create-order.request';
import {
	CreateOrderResponse,
	OrderResponse,
} from '@/modules/ordering/presentation/swagger';

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
		const result = await this.commandBus.execute<{ orderId: string }>(
			new CreateOrderCommand(body),
		);
		return ResponseHelper.data(CreateOrderResponse.fromResult(result));
	}

	@Get()
	@ApiPageResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageEnvelope<OrderResponse>> {
		const result = await this.queryBus.execute<
			PaginatedResult<OrderResult>
		>(new ListOrdersQuery(Number(limitRaw), Number(pageRaw)));
		const response = OrderResponse.fromResults(result.items);
		return ResponseHelper.page({
			...result,
			items: response,
		});
	}

	@Get(':id')
	@ApiDataResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(@Param('id') id: string): Promise<DataEnvelope<OrderResponse>> {
		const order = await this.queryBus.execute<OrderResult | null>(
			new GetOrderQuery(id),
		);
		if (!isOrderResult(order))
			throw new NotFoundException('order not found');
		return ResponseHelper.data(OrderResponse.fromResult(order));
	}
}

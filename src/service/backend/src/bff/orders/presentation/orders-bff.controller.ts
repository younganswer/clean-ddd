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
import { DataEnvelope, ListEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
} from '@/common/swagger';
import {
	CreateOrderResponse,
	OrderResponse,
} from '@/bff/orders/presentation/swagger';

import {
	CreateOrderBffBodyDto,
	ListOrdersBffQueryDto,
} from '@/bff/orders/presentation/orders-bff.dto';
import { CreateOrderBffCommand } from '@/bff/orders/application/commands/create-order-bff.command';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';
import { ListOrdersBffQuery } from '@/bff/orders/application/queries/list-orders-bff.query';
import type { OrderResult } from '@/shared/ordering/readers/order.result';

@Controller('bff/orders')
export class OrdersBffController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	@ApiListResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: ListOrdersBffQueryDto,
	): Promise<ListEnvelope<OrderResponse>> {
		const result = await this.queryBus.execute<
			ListOrdersBffQuery,
			OrderResult[]
		>(new ListOrdersBffQuery({ limit: query.limit }));
		return ResponseHelper.list(OrderResponse.fromResults(result));
	}

	@Get(':orderId')
	@ApiDataResponse({ model: OrderResponse })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('orderId') orderId: string,
	): Promise<DataEnvelope<OrderResponse>> {
		const order = await this.queryBus.execute<
			GetOrderBffQuery,
			OrderResult | null
		>(new GetOrderBffQuery({ orderId }));
		if (!order) throw new NotFoundException('order not found');
		return ResponseHelper.data(OrderResponse.fromResult(order));
	}

	@Post()
	@ApiDataResponse({ model: CreateOrderResponse }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateOrderBffBodyDto,
	): Promise<DataEnvelope<CreateOrderResponse>> {
		const result = await this.commandBus.execute<
			CreateOrderBffCommand,
			{ orderId: string }
		>(new CreateOrderBffCommand({ body }));
		return ResponseHelper.data(CreateOrderResponse.fromResult(result));
	}
}

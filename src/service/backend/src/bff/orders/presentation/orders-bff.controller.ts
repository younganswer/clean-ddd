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
import { DataResponse, ListResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiListResponse,
} from '@/common/swagger';
import {
	CreateOrderResultResponseDto,
	OrderResponseDto,
} from '@/bff/orders/presentation/swagger';

import {
	CreateOrderBffBodyDto,
	ListOrdersBffQueryDto,
} from '@/bff/orders/presentation/orders-bff.dto';
import { CreateOrderBffCommand } from '@/bff/orders/application/commands/create-order-bff.command';
import { GetOrderBffQuery } from '@/bff/orders/application/queries/get-order-bff.query';
import { ListOrdersBffQuery } from '@/bff/orders/application/queries/list-orders-bff.query';
import type { OrderView } from '@/shared/ordering/readers/order.view';

@Controller('bff/orders')
export class OrdersBffController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Get()
	@ApiListResponse({ model: OrderResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query() query: ListOrdersBffQueryDto,
	): Promise<ListResponse<OrderView>> {
		const limit = query.limit ?? 20;
		const result = await this.queryBus.execute<
			ListOrdersBffQuery,
			OrderView[]
		>(new ListOrdersBffQuery({ limit }));
		return ListResponse.from(result);
	}

	@Get(':orderId')
	@ApiDataResponse({ model: OrderResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(
		@Param('orderId') orderId: string,
	): Promise<DataResponse<OrderView>> {
		const order = await this.queryBus.execute<
			GetOrderBffQuery,
			OrderView | null
		>(new GetOrderBffQuery({ orderId }));
		if (!order) throw new NotFoundException('order not found');
		return DataResponse.of(order);
	}

	@Post()
	@ApiDataResponse({ model: CreateOrderResultResponseDto }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateOrderBffBodyDto,
	): Promise<DataResponse<{ orderId: string }>> {
		const result = await this.commandBus.execute<
			CreateOrderBffCommand,
			{ orderId: string }
		>(new CreateOrderBffCommand({ body }));
		return DataResponse.of(result);
	}
}

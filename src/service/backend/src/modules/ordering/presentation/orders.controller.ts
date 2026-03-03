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
import { DataResponse, PageResponse } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
	ApiPageResponse,
} from '@/common/swagger';
import { CreateOrderCommand } from '@/shared/ordering/commands/create-order.command';
import { GetOrderQuery } from '@/shared/ordering/queries/get-order.query';
import { ListOrdersQuery } from '@/shared/ordering/queries/list-orders.query';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import type { OrderView } from '@/shared/ordering/readers/order.view';
import { isOrderView } from '@/shared/ordering/readers/order-view.guard';
import { CreateOrderRequest } from '@/modules/ordering/presentation/dto/create-order.request';
import {
	CreateOrderResultResponseDto,
	OrderResponseDto,
} from '@/modules/ordering/presentation/swagger';

@Controller('orders')
export class OrdersController {
	constructor(
		private readonly commandBus: CommandBus,
		private readonly queryBus: QueryBus,
	) {}

	@Post()
	@ApiDataResponse({ model: CreateOrderResultResponseDto }, { status: 201 })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async create(
		@Body() body: CreateOrderRequest,
	): Promise<DataResponse<{ orderId: string }>> {
		const result = await this.commandBus.execute<{ orderId: string }>(
			new CreateOrderCommand(body),
		);
		return DataResponse.of(result);
	}

	@Get()
	@ApiPageResponse({ model: OrderResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async list(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<PageResponse<OrderView>> {
		const limit = Math.min(50, Math.max(1, Number(limitRaw ?? '20') || 20));
		const page = Math.max(1, Number(pageRaw ?? '1') || 1);
		const result = await this.queryBus.execute<PaginatedView<OrderView>>(
			new ListOrdersQuery(limit, page),
		);
		return PageResponse.from(result);
	}

	@Get(':id')
	@ApiDataResponse({ model: OrderResponseDto })
	@ApiErrorEnvelopeResponse({ status: 404 })
	async get(@Param('id') id: string): Promise<DataResponse<OrderView>> {
		const order = await this.queryBus.execute<OrderView | null>(
			new GetOrderQuery(id),
		);
		if (!isOrderView(order)) throw new NotFoundException('order not found');
		return DataResponse.of(order);
	}
}

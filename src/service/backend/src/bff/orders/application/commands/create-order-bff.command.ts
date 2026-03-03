import { Command } from '@nestjs/cqrs';
import type { CreateOrderBffBodyDto } from '@/bff/orders/presentation/orders-bff.dto';

export class CreateOrderBffCommand extends Command<{ orderId: string }> {
	constructor(public readonly input: { body: CreateOrderBffBodyDto }) {
		super();
	}
}

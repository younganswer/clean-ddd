import type { CreateOrderBffBodyDto } from '@/bff/orders/presentation/orders-bff.dto';

export class CreateOrderBffCommand {
  constructor(public readonly input: { body: CreateOrderBffBodyDto }) {}
}

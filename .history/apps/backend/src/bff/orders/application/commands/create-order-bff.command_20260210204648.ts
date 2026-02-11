import type { CreateOrderBffBodyDto } from '../../presentation/orders-bff.dto';

export class CreateOrderBffCommand {
  constructor(public readonly input: { body: CreateOrderBffBodyDto }) {}
}

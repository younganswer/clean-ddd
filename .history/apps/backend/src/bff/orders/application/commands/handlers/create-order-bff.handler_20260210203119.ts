import { CommandBus, CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '../../../../../shared/ordering/commands/create-order.command';
import { CreateOrderBffCommand } from '../create-order-bff.command';

@CommandHandler(CreateOrderBffCommand)
export class CreateOrderBffHandler
  implements ICommandHandler<CreateOrderBffCommand>
{
  constructor(private readonly commandBus: CommandBus) {}

  async execute(command: CreateOrderBffCommand): Promise<{ orderId: string }> {
    // BFF는 도메인 로직을 갖지 않고, 도메인 Command를 호출하는 오케스트레이션만 담당합니다.
    const body = command.input.body;
    const domainCommand = new CreateOrderCommand({
      amount: body.amount,
      currency: body.currency,
      items: body.items?.map((i) => ({ sku: i.sku, quantity: i.quantity })),
    });

    // OrderingModule에 CreateOrderHandler가 등록되어 있으므로, 동일 CommandBus로 위임합니다.
    return await this.commandBus.execute(
      domainCommand as unknown as never,
    );
  }
}

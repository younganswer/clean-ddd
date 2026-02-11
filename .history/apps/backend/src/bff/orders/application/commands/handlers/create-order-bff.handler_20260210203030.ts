import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';

import { CreateOrderCommand } from '../../../../../shared/ordering/commands/create-order.command';
import { CreateOrderBffCommand } from '../create-order-bff.command';

@CommandHandler(CreateOrderBffCommand)
export class CreateOrderBffHandler
  implements ICommandHandler<CreateOrderBffCommand>
{
  async execute(command: CreateOrderBffCommand): Promise<{ orderId: string }> {
    // BFF는 도메인 로직을 갖지 않고, 도메인 Command를 호출하는 오케스트레이션만 담당합니다.
    const body = command.input.body;
    const domainCommand = new CreateOrderCommand({
      amount: body.amount,
      currency: body.currency,
      items: body.items?.map((i) => ({ sku: i.sku, quantity: i.quantity })),
    });

    // OrderingModule에 이미 CreateOrderHandler가 등록되어 있으므로, 동일 CommandBus를 통해 실행됩니다.
    // Nest CQRS는 Command class 기준으로 핸들러를 라우팅합니다.
    return (await (command as any).commandBus?.execute(domainCommand)) as any;
  }
}

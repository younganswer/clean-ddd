import { Command } from '@nestjs/cqrs';

export class MarkOrderPaidCommand extends Command<void> {
  constructor(public readonly orderId: string) {
    super();
  }
}

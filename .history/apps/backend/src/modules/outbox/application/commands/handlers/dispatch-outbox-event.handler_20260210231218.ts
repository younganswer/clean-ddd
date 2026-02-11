import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { DispatchOutboxEventCommand } from 'src/shared/outbox/commands/dispatch-outbox-event.command';
import {
  IOutboxRepositorySymbol,
  type IOutboxRepository,
} from 'src/shared/outbox';
import { OutboxQueue } from '../../../infrastructure/queue/outbox.queue';

@CommandHandler(DispatchOutboxEventCommand)
export class DispatchOutboxEventHandler implements ICommandHandler<DispatchOutboxEventCommand> {
  constructor(
    @Inject(IOutboxRepositorySymbol)
    private readonly outboxRepo: IOutboxRepository,
    private readonly outboxQueue: OutboxQueue,
  ) {}

  async execute(command: DispatchOutboxEventCommand): Promise<void> {
    const outboxId = String(command.outboxId ?? '').trim();
    if (!outboxId) return;

    const messageGroupId =
      String(command.messageGroupId ?? '').trim() || 'outbox';

    try {
      await this.outboxQueue.enqueue(outboxId, { messageGroupId });
    } catch (error: unknown) {
      const maybeError =
        typeof error === 'object' && error !== null
          ? (error as Record<string, unknown>)
          : undefined;
      const message = String(maybeError?.message ?? error);
      await this.outboxRepo.recordFailure(
        outboxId,
        message,
        new Date(Date.now() + 30_000),
      );
    }
  }
}

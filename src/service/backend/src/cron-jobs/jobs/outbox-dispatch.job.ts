import { Injectable, Logger } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isOutboxCronEnabled } from '@/runtime-role';
import { DispatchPendingOutboxEventsCommand } from '@/shared/outbox';

@Injectable()
export class OutboxDispatchJob {
	private readonly logger = new Logger(OutboxDispatchJob.name);

	constructor(private readonly commandBus: CommandBus) {}

	@Cron(CronExpression.EVERY_5_SECONDS)
	async run(): Promise<void> {
		if (!isOutboxCronEnabled()) return;

		try {
			await this.commandBus.execute(
				new DispatchPendingOutboxEventsCommand({
					limit: 10,
					now: new Date(),
				}),
			);
		} catch (error) {
			this.logger.warn(`failed: ${String(error)}`);
		}
	}
}

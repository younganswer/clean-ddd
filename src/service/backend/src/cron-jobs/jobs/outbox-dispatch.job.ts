import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isOutboxCronEnabled } from '@/bootstrap/runtime-role';
import { DispatchPendingOutboxEventsCommand } from '@/modules/outbox/application/commands/dispatch-pending-outbox-events.command';
import { LogBoundary } from '@/common/logging/log-boundary.decorator';

@Injectable()
export class OutboxDispatchJob {
	constructor(private readonly commandBus: CommandBus) {}

	@Cron(CronExpression.EVERY_5_SECONDS)
	@LogBoundary<[], void>({
		failed: {
			step: 'outbox_dispatch_job_failed',
			level: 'warn',
		},
		rethrow: false,
	})
	async run(): Promise<void> {
		if (!isOutboxCronEnabled()) return;

		const command = new DispatchPendingOutboxEventsCommand({
			limit: 10,
			now: new Date(),
		});
		await this.commandBus.execute(command);
	}
}

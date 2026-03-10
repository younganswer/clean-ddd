import { Injectable } from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { Cron, CronExpression } from '@nestjs/schedule';
import { isOutboxCronEnabled } from '@/runtime-role';
import { DispatchPendingOutboxEventsCommand } from '@/modules/outbox/application/commands/dispatch-pending-outbox-events.command';
import {
	resolveStructuredLogErrorMessage,
	writeStructuredLog,
} from '@/common/logging/structured-log';

@Injectable()
export class OutboxDispatchJob {
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
			writeStructuredLog(
				OutboxDispatchJob.name,
				{
					step: 'outbox_dispatch_job_failed',
					error: resolveStructuredLogErrorMessage(error),
				},
				'warn',
			);
		}
	}
}

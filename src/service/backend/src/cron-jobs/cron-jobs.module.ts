import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxDispatchJob } from '@/cron-jobs/jobs/outbox-dispatch.job';
import { OutboxModule } from '@/modules/outbox/outbox.module';

@Module({
	imports: [CqrsModule, OutboxModule],
	providers: [OutboxDispatchJob],
})
export class CronJobsModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxDispatchJob } from '@/cron-jobs/jobs/outbox-dispatch.job';
import { OutboxModule } from '@/modules/outbox/outbox.module';

const CronJobsImports = [CqrsModule, OutboxModule];

const CronJobsProviders = [OutboxDispatchJob];

@Module({
	imports: CronJobsImports,
	providers: CronJobsProviders,
})
export class CronJobsModule {}

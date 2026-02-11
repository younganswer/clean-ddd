import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { OutboxDispatchJob } from './jobs/outbox-dispatch.job';

@Module({
  imports: [CqrsModule],
  providers: [OutboxDispatchJob],
})
export class CronJobsModule {}

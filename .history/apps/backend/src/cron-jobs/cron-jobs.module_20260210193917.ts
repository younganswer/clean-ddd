import { Module } from '@nestjs/common';
import { OutboxModule } from '../shared/outbox/modules/outbox.module';
import { OutboxDispatchJob } from './jobs/outbox-dispatch.job';

@Module({
  imports: [OutboxModule],
  providers: [OutboxDispatchJob],
})
export class CronJobsModule {}

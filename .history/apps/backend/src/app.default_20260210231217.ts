import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { ScheduleModule } from '@nestjs/schedule';
import { DatabaseModule } from './lib/database/database.module';
import { OutboxModule } from './modules/outbox/outbox.module';
import { OutboxConsumerModule } from './modules/outbox/outbox-consumer.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { InventoryModule } from './modules/inventory/inventory.module';
import { CronJobsModule } from './cron-jobs/cron-jobs.module';
import { SagaOrchestratorModule } from './saga-orchestrator/saga-orchestrator.module';
import { BffModule } from './bff/bff.module';

export const appDefaultImportList = [
  ConfigModule.forRoot({
    isGlobal: true,
  }),
  CqrsModule,
  ScheduleModule.forRoot(),
  DatabaseModule,
  OutboxModule,
  OutboxConsumerModule,
  BffModule,
  CronJobsModule,
  SagaOrchestratorModule,
  OrderingModule,
  PaymentsModule,
  ShippingModule,
  InventoryModule,
];

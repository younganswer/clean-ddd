import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { InventoryModule } from '../../modules/inventory/inventory.module';
import { ShippingModule } from '../../modules/shipping/shipping.module';
import { SqsModule } from '../sqs/sqs.module';
import { OutboxModule } from './modules/outbox.module';
import { OutboxConsumer } from './application/outbox.consumer';
import { OutboxRouter } from './application/outbox.router';
import { OutboxSqsPoller } from './infrastructure/sqs/outbox.sqs-poller';

@Module({
  imports: [
    OutboxModule,
    SqsModule,
    PaymentsModule,
    ShippingModule,
    InventoryModule,
  ],
  providers: [OutboxRouter, OutboxConsumer, OutboxSqsPoller],
  exports: [OutboxConsumer],
})
export class OutboxConsumerModule {}

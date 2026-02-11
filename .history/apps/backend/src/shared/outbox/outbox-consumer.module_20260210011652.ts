import { Module } from '@nestjs/common';
import { PaymentsModule } from '../../modules/payments/payments.module';
import { InventoryModule } from '../../modules/inventory/inventory.module';
import { ShippingModule } from '../../modules/shipping/shipping.module';
import { SqsModule } from '../sqs/sqs.module';
import { OutboxModule } from './outbox.module';
import { OutboxConsumer } from './outbox.consumer';
import { OutboxRouter } from './outbox.router';
import { OutboxSqsPoller } from './outbox.sqs-poller';

@Module({
  imports: [OutboxModule, SqsModule, PaymentsModule, ShippingModule, InventoryModule],
  providers: [OutboxRouter, OutboxConsumer, OutboxSqsPoller],
  exports: [OutboxConsumer],
})
export class OutboxConsumerModule {}

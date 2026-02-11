import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { CqrsModule } from '@nestjs/cqrs';
import { DatabaseModule } from './lib/database/database.module';
import { OutboxModule } from './shared/outbox/modules/outbox.module';
import { OutboxConsumerModule } from './shared/outbox/modules/outbox-consumer.module';
import { OrderingModule } from './modules/ordering/ordering.module';
import { PaymentsModule } from './modules/payments/payments.module';
import { ShippingModule } from './modules/shipping/shipping.module';
import { InventoryModule } from './modules/inventory/inventory.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    DatabaseModule,
    OutboxModule,
    OutboxConsumerModule,
    OrderingModule,
    PaymentsModule,
    ShippingModule,
    InventoryModule,
  ],
})
export class AppModule {}

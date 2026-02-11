import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { CqrsModule } from "@nestjs/cqrs";
import { DatabaseModule } from "./lib/database/database.module";
import { OutboxModule } from "./shared/outbox/outbox.module";
import { OrderingModule } from "./modules/ordering/ordering.module";
import { PaymentsModule } from "./modules/payments/payments.module";
import { ShippingModule } from "./modules/shipping/shipping.module";
import { InventoryModule } from "./modules/inventory/inventory.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    CqrsModule,
    DatabaseModule,
    OutboxModule,
    OrderingModule,
    PaymentsModule,
    ShippingModule,
    InventoryModule,
  ],
})
export class AppModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrderDetailBffController } from '@/bff/order-detail/presentation/order-detail-bff.controller';
import { QueryHandlers } from '@/bff/order-detail/application/queries';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';

@Module({
	imports: [
		CqrsModule,
		OrderingModule,
		PaymentsModule,
		ShippingModule,
		InventoryModule,
	],
	controllers: [OrderDetailBffController],
	providers: [...QueryHandlers],
})
export class OrderDetailBffModule {}

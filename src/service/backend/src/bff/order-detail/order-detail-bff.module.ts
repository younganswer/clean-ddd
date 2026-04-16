import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrderDetailBffController } from '@/bff/order-detail/presentation/order-detail-bff.controller';
import { OrderDetailBffQueryHandlers } from '@/bff/order-detail/application/queries';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';

const OrderDetailBffImports = [
	CqrsModule,
	OrderingModule,
	PaymentsModule,
	ShippingModule,
	InventoryModule,
];

const OrderDetailBffControllers = [OrderDetailBffController];

const OrderDetailBffProviders = [...OrderDetailBffQueryHandlers];

@Module({
	imports: OrderDetailBffImports,
	controllers: OrderDetailBffControllers,
	providers: OrderDetailBffProviders,
})
export class OrderDetailBffModule {}

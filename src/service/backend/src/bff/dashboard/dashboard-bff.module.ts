import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DashboardBffController } from '@/bff/dashboard/presentation/dashboard-bff.controller';
import { DashboardBffQueryHandlers } from '@/bff/dashboard/application/queries';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';

const DashboardBffImports = [
	CqrsModule,
	OrderingModule,
	PaymentsModule,
	ShippingModule,
	InventoryModule,
];

const DashboardBffControllers = [DashboardBffController];

const DashboardBffProviders = [...DashboardBffQueryHandlers];

@Module({
	imports: DashboardBffImports,
	controllers: DashboardBffControllers,
	providers: DashboardBffProviders,
})
export class DashboardBffModule {}

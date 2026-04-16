import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffController } from '@/bff/orders/presentation/orders-bff.controller';
import { OrdersBffCommandHandlers } from '@/bff/orders/application/commands';
import { OrdersBffQueryHandlers } from '@/bff/orders/application/queries';
import { OrderingModule } from '@/modules/ordering/ordering.module';

const OrdersBffImports = [CqrsModule, OrderingModule];

const OrdersBffControllers = [OrdersBffController];

const OrdersBffHandlers = [
	...OrdersBffCommandHandlers,
	...OrdersBffQueryHandlers,
];

const OrdersBffProviders = [...OrdersBffHandlers];

@Module({
	imports: OrdersBffImports,
	controllers: OrdersBffControllers,
	providers: OrdersBffProviders,
})
export class OrdersBffModule {}

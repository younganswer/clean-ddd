import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GraphBffController } from '@/bff/graph/presentation/graph-bff.controller';
import { GraphBffQueryHandlers } from '@/bff/graph/application/queries';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';
import { UserModule } from '@/modules/user/user.module';

const GraphBffImports = [
	CqrsModule,
	OrderingModule,
	PaymentsModule,
	ShippingModule,
	UserModule,
	OutboxModule,
];

const GraphBffControllers = [GraphBffController];

const GraphBffProviders = [...GraphBffQueryHandlers];

@Module({
	imports: GraphBffImports,
	controllers: GraphBffControllers,
	providers: GraphBffProviders,
})
export class GraphBffModule {}

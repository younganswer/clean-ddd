import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { GraphBffController } from '@/bff/graph/presentation/graph-bff.controller';
import { QueryHandlers } from '@/bff/graph/application/queries';
import { OrderingModule } from '@/modules/ordering/ordering.module';
import { OutboxModule } from '@/modules/outbox/outbox.module';
import { PaymentsModule } from '@/modules/payments/payments.module';
import { ShippingModule } from '@/modules/shipping/shipping.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
	imports: [
		CqrsModule,
		OrderingModule,
		PaymentsModule,
		ShippingModule,
		UsersModule,
		OutboxModule,
	],
	controllers: [GraphBffController],
	providers: [...QueryHandlers],
})
export class GraphBffModule {}

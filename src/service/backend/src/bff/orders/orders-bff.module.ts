import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { OrdersBffController } from '@/bff/orders/presentation/orders-bff.controller';
import { CommandHandlers } from '@/bff/orders/application/commands';
import { QueryHandlers } from '@/bff/orders/application/queries';
import { OrderingModule } from '@/modules/ordering/ordering.module';

@Module({
	imports: [CqrsModule, OrderingModule],
	controllers: [OrdersBffController],
	providers: [...CommandHandlers, ...QueryHandlers],
})
export class OrdersBffModule {}

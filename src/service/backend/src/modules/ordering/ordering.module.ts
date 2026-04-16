import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IOrderReaderSymbol } from '@/modules/ordering/domains/readers/i.order.reader';
import { OrderingProviders } from '@/modules/ordering/domains';
import { OrderingControllers } from '@/modules/ordering/presentation';

const OrderingImports = [CqrsModule];

const OrderingExports = [IOrderReaderSymbol];

@Module({
	imports: OrderingImports,
	controllers: OrderingControllers,
	providers: OrderingProviders,
	exports: OrderingExports,
})
export class OrderingModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IShipmentReaderSymbol } from '@/modules/shipping/domains/readers/i.shipment.reader';
import { ShippingProviders } from '@/modules/shipping/domains';
import { ShippingControllers } from '@/modules/shipping/presentation';

const ShippingImports = [CqrsModule];

const ShippingExports = [IShipmentReaderSymbol];

@Module({
	imports: ShippingImports,
	controllers: ShippingControllers,
	providers: ShippingProviders,
	exports: ShippingExports,
})
export class ShippingModule {}

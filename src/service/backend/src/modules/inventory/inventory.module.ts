import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IInventoryReaderSymbol } from '@/modules/inventory/domain/readers/i.inventory.reader';
import { InventoryProviders } from '@/modules/inventory/domain';
import { InventoryControllers } from '@/modules/inventory/presentation';

const InventoryImports = [CqrsModule];

const InventoryExports = [IInventoryReaderSymbol];

@Module({
	imports: InventoryImports,
	controllers: InventoryControllers,
	providers: InventoryProviders,
	exports: InventoryExports,
})
export class InventoryModule {}

import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { SystemConceptsBffQueryHandlers } from '@/bff/system-concepts/application/queries';
import { SystemConceptsBffController } from '@/bff/system-concepts/presentation/system-concepts-bff.controller';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { UserModule } from '@/modules/user/user.module';

const SystemConceptsBffImports = [CqrsModule, UserModule, InventoryModule];

const SystemConceptsBffControllers = [SystemConceptsBffController];

const SystemConceptsBffProviders = [...SystemConceptsBffQueryHandlers];

@Module({
	imports: SystemConceptsBffImports,
	controllers: SystemConceptsBffControllers,
	providers: SystemConceptsBffProviders,
})
export class SystemConceptsBffModule {}

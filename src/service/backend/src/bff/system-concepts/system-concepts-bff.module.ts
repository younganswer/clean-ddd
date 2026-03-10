import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { QueryHandlers } from '@/bff/system-concepts/application/queries';
import { SystemConceptsBffController } from '@/bff/system-concepts/presentation/system-concepts-bff.controller';
import { InventoryModule } from '@/modules/inventory/inventory.module';
import { UsersModule } from '@/modules/users/users.module';

@Module({
	imports: [CqrsModule, UsersModule, InventoryModule],
	controllers: [SystemConceptsBffController],
	providers: [...QueryHandlers],
})
export class SystemConceptsBffModule {}

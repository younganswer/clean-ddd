import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DashboardBffController } from '@/bff/dashboard/presentation/dashboard-bff.controller';
import { QueryHandlers } from '@/bff/dashboard/application/queries';

@Module({
	imports: [CqrsModule],
	controllers: [DashboardBffController],
	providers: [...QueryHandlers],
})
export class DashboardBffModule {}

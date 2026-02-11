import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DashboardBffController } from './presentation/dashboard-bff.controller';
import { GetDashboardSummaryBffHandler } from './application/queries/handlers/get-dashboard-summary-bff.handler';

@Module({
  imports: [CqrsModule],
  controllers: [DashboardBffController],
  providers: [GetDashboardSummaryBffHandler],
})
export class DashboardBffModule {}

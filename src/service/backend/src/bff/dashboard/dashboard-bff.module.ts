import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';

import { DashboardBffController } from './presentation/dashboard-bff.controller';
import { QueryHandlers } from './application/queries';

@Module({
  imports: [CqrsModule],
  controllers: [DashboardBffController],
  providers: [...QueryHandlers],
})
export class DashboardBffModule {}

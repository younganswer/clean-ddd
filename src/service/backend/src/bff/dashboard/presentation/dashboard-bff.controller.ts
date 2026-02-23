import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';

import { GetDashboardSummaryBffQueryDto } from '@/bff/dashboard/presentation/dashboard-bff.dto';
import {
	GetDashboardSummaryBffQuery,
	type DashboardSummaryBffView,
} from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';

@Controller('bff/dashboard')
export class DashboardBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('summary')
	async summary(
		@Query() query: GetDashboardSummaryBffQueryDto,
	): Promise<DashboardSummaryBffView> {
		const limit = query.limit ?? 10;
		return await this.queryBus.execute<
			GetDashboardSummaryBffQuery,
			DashboardSummaryBffView
		>(new GetDashboardSummaryBffQuery({ limit }));
	}
}

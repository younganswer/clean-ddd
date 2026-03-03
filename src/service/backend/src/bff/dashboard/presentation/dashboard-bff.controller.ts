import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { DashboardSummaryBffResponseDto } from '@/bff/dashboard/presentation/swagger';

import { GetDashboardSummaryBffQueryDto } from '@/bff/dashboard/presentation/dashboard-bff.dto';
import {
	GetDashboardSummaryBffQuery,
	type DashboardSummaryBffView,
} from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';

@Controller('bff/dashboard')
export class DashboardBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('summary')
	@ApiDataResponse({ model: DashboardSummaryBffResponseDto as never })
	@ApiErrorEnvelopeResponse({ status: 500 })
	async summary(
		@Query() query: GetDashboardSummaryBffQueryDto,
	): Promise<DataResponse<DashboardSummaryBffView>> {
		const limit = query.limit ?? 10;
		const result = await this.queryBus.execute<
			GetDashboardSummaryBffQuery,
			DashboardSummaryBffView
		>(new GetDashboardSummaryBffQuery({ limit }));
		return DataResponse.of(result);
	}
}

import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { DashboardSummaryBffResponse } from '@/bff/dashboard/presentation/swagger';

import { GetDashboardSummaryBffQueryDto } from '@/bff/dashboard/presentation/dashboard-bff.dto';
import {
	GetDashboardSummaryBffQuery,
	type DashboardSummaryBffView,
} from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';

@Controller('bff/dashboard')
export class DashboardBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('summary')
	@ApiDataResponse({ model: DashboardSummaryBffResponse as never })
	@ApiErrorEnvelopeResponse({ status: 500 })
	async summary(
		@Query() query: GetDashboardSummaryBffQueryDto,
	): Promise<DataEnvelope<DashboardSummaryBffResponse>> {
		const result = await this.queryBus.execute<
			GetDashboardSummaryBffQuery,
			DashboardSummaryBffView
		>(new GetDashboardSummaryBffQuery({ limit: query.limit }));
		return ResponseHelper.data(
			DashboardSummaryBffResponse.fromResult(result),
		);
	}
}

import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import {
	ApiDataResponse,
	ApiErrorEnvelopeResponse,
} from '@/common/swagger/api-response.decorator';
import { DashboardSummaryBffResponse } from '@/bff/dashboard/presentation/swagger/dashboard.response';
import { GetDashboardSummaryBffQuery } from '@/bff/dashboard/application/queries/get-dashboard-summary-bff.query';

@Controller('bff/dashboard')
export class DashboardBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('summary')
	@ApiDataResponse({ model: DashboardSummaryBffResponse as never })
	@ApiErrorEnvelopeResponse({ status: 500 })
	async summary(
		@Query('limit') limit?: string,
	): Promise<DataEnvelope<DashboardSummaryBffResponse>> {
		const query = new GetDashboardSummaryBffQuery({
			limit: limit ? parseInt(limit, 10) : undefined,
		});
		const result = await this.queryBus.execute(query);
		const response = DashboardSummaryBffResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}

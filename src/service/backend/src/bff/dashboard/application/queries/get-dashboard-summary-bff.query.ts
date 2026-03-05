import { Query } from '@nestjs/cqrs';
import { toBoundedInt } from '@/shared/cqrs/input-normalizer';
import type { DashboardSummaryBffView } from '@/bff/dashboard/application/views/dashboard-summary-bff.view';

export class GetDashboardSummaryBffQuery extends Query<DashboardSummaryBffView> {
	public readonly limit: number;

	constructor(input: { limit?: number }) {
		super();
		this.limit = toBoundedInt(input.limit, {
			min: 1,
			max: 20,
			fallback: 5,
		});
	}
}

import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { SystemConceptsBootstrapResponse } from '@/bff/system-concepts/presentation/swagger';
import { GetInventoryItemsQuery } from '@/shared/inventory';
import { GetUserProfilesQuery } from '@/shared/users/queries/get-user-profiles.query';
import { PageQueryDto } from '@/shared/cqrs/query-input.dto';

@Controller('bff/system-concepts')
export class SystemConceptsBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('bootstrap')
	@ApiDataResponse({ model: SystemConceptsBootstrapResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async bootstrap(
		@Query() query: PageQueryDto,
	): Promise<DataEnvelope<SystemConceptsBootstrapResponse>> {
		const [users, inventoryItems] = await Promise.all([
			this.queryBus.execute(
				new GetUserProfilesQuery({
					limit: query.limit ?? Number.NaN,
					offset: query.offset ?? Number.NaN,
				}),
			),
			this.queryBus.execute(
				new GetInventoryItemsQuery({
					limit: query.limit ?? Number.NaN,
					offset: query.offset ?? Number.NaN,
				}),
			),
		]);
		const result = { users, inventoryItems };
		const response = SystemConceptsBootstrapResponse.fromResult(result);

		return ResponseHelper.data(response);
	}
}

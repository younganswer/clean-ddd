import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataEnvelope, ResponseHelper } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { SystemConceptsBootstrapResponse } from '@/bff/system-concepts/presentation/swagger';
import {
	ListInventoryItemsQuery,
	type InventoryItemResult,
} from '@/shared/inventory';
import type { PaginatedResult } from '@/shared/readers/paginated.result';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileResult } from '@/shared/users/readers/user-profile.result';

@Controller('bff/system-concepts')
export class SystemConceptsBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('bootstrap')
	@ApiDataResponse({ model: SystemConceptsBootstrapResponse })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async bootstrap(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<DataEnvelope<SystemConceptsBootstrapResponse>> {
		const [users, inventoryItems] = await Promise.all([
			this.queryBus.execute<
				ListUserProfilesQuery,
				PaginatedResult<UserProfileResult>
			>(
				new ListUserProfilesQuery({
					limit: Number(limitRaw),
					page: Number(pageRaw),
				}),
			),
			this.queryBus.execute<
				ListInventoryItemsQuery,
				PaginatedResult<InventoryItemResult>
			>(new ListInventoryItemsQuery(Number(limitRaw), Number(pageRaw))),
		]);

		return ResponseHelper.data(
			SystemConceptsBootstrapResponse.fromResult({
				users,
				inventoryItems,
			}),
		);
	}
}

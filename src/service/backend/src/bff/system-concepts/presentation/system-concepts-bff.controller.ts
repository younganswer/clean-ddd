import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { DataResponse } from '@/common/responses';
import { ApiDataResponse, ApiErrorEnvelopeResponse } from '@/common/swagger';
import { SystemConceptsBootstrapResponseDto } from '@/bff/system-concepts/presentation/swagger';
import {
	ListInventoryItemsQuery,
	type InventoryItemView,
} from '@/shared/inventory';
import type { PaginatedView } from '@/shared/readers/paginated.view';
import { ListUserProfilesQuery } from '@/shared/users/queries/list-user-profiles.query';
import type { UserProfileView } from '@/shared/users/readers/user-profile.view';

type SystemConceptsBootstrapView = {
	users: PaginatedView<UserProfileView>;
	inventoryItems: PaginatedView<InventoryItemView>;
};

@Controller('bff/system-concepts')
export class SystemConceptsBffController {
	constructor(private readonly queryBus: QueryBus) {}

	@Get('bootstrap')
	@ApiDataResponse({ model: SystemConceptsBootstrapResponseDto })
	@ApiErrorEnvelopeResponse({ status: 400 })
	async bootstrap(
		@Query('limit') limitRaw?: string,
		@Query('page') pageRaw?: string,
	): Promise<DataResponse<SystemConceptsBootstrapView>> {
		const [users, inventoryItems] = await Promise.all([
			this.queryBus.execute<
				ListUserProfilesQuery,
				PaginatedView<UserProfileView>
			>(
				new ListUserProfilesQuery({
					limit: Number(limitRaw),
					page: Number(pageRaw),
				}),
			),
			this.queryBus.execute<
				ListInventoryItemsQuery,
				PaginatedView<InventoryItemView>
			>(new ListInventoryItemsQuery(Number(limitRaw), Number(pageRaw))),
		]);

		return DataResponse.of({
			users,
			inventoryItems,
		});
	}
}

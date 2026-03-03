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
		const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
		const page = Math.max(1, Number(pageRaw ?? 1) || 1);

		const [users, inventoryItems] = await Promise.all([
			this.queryBus.execute<
				ListUserProfilesQuery,
				PaginatedView<UserProfileView>
			>(
				new ListUserProfilesQuery({
					limit,
					page,
				}),
			),
			this.queryBus.execute<
				ListInventoryItemsQuery,
				PaginatedView<InventoryItemView>
			>(new ListInventoryItemsQuery(limit, page)),
		]);

		return DataResponse.of({
			users,
			inventoryItems,
		});
	}
}

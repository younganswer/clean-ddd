import { Controller, Get, Query } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { executeQuery } from '@/common/utils/cqrs-executor';
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
  async bootstrap(
    @Query('limit') limitRaw?: string,
    @Query('page') pageRaw?: string,
  ): Promise<SystemConceptsBootstrapView> {
    const limit = Math.min(Math.max(Number(limitRaw ?? 50) || 50, 1), 200);
    const page = Math.max(1, Number(pageRaw ?? 1) || 1);

    const [users, inventoryItems] = await Promise.all([
      executeQuery<PaginatedView<UserProfileView>>(
        this.queryBus,
        new ListUserProfilesQuery({
          limit,
          page,
        }),
      ),
      executeQuery<PaginatedView<InventoryItemView>>(
        this.queryBus,
        new ListInventoryItemsQuery(limit, page),
      ),
    ]);

    return {
      users,
      inventoryItems,
    };
  }
}

import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import {
	GetSystemConceptsBootstrapBffQuery,
	type SystemConceptsBootstrapBffResult,
} from '@/bff/system-concepts/application/queries/get-system-concepts-bootstrap-bff.query';
import {
	IInventoryReaderSymbol,
	type IInventoryReader,
} from '@/modules/inventory/domains/readers/i.inventory.reader';
import type { InventoryItemResult } from '@/modules/inventory/domains/readers/inventory-item.result';
import type { PaginatedResult } from '@/common/types/paginated.result';
import {
	IUserReaderSymbol,
	type IUserReader,
} from '@/modules/users/domains/readers/i.user.reader';
import {
	IUserAvatarReaderSymbol,
	type IUserAvatarReader,
} from '@/modules/users/domains/readers/i.user-avatar.reader';
import { UserProfileResult } from '@/modules/users/domains/readers/user-profile.result';

@QueryHandler(GetSystemConceptsBootstrapBffQuery)
export class GetSystemConceptsBootstrapBffHandler implements IQueryHandler<GetSystemConceptsBootstrapBffQuery> {
	constructor(
		@Inject(IUserReaderSymbol)
		private readonly userReader: IUserReader,
		@Inject(IUserAvatarReaderSymbol)
		private readonly userAvatarReader: IUserAvatarReader,
		@Inject(IInventoryReaderSymbol)
		private readonly inventoryReader: IInventoryReader,
	) {}

	async execute(
		query: GetSystemConceptsBootstrapBffQuery,
	): Promise<SystemConceptsBootstrapBffResult> {
		const [users, inventoryItems] = await Promise.all([
			this.getUsersPage(query.limit, query.offset),
			this.getInventoryItemsPage(query.limit, query.offset),
		]);

		return { users, inventoryItems };
	}

	private async getUsersPage(
		limit: number,
		offset: number,
	): Promise<PaginatedResult<UserProfileResult>> {
		const [items, total] = await Promise.all([
			this.userReader.findAll({ limit, offset }),
			this.userReader.countAll(),
		]);

		const avatarIds = [...new Set(items.map((item) => item.avatarId ?? ''))]
			.map((id) => id.trim())
			.filter((id) => id.length > 0);

		const avatars = await this.userAvatarReader.findByAvatarIds(avatarIds);
		const avatarById = new Map(
			avatars.map((avatar) => [avatar.avatarId, avatar]),
		);

		const enrichedItems = items.map((item) =>
			item.avatarId
				? new UserProfileResult(
						item.userId,
						item.displayName,
						item.email,
						item.avatarId,
						avatarById.get(item.avatarId)?.imageUrl,
					)
				: item,
		);

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items: enrichedItems,
			offset,
			limit,
			total,
			totalPages,
			hasNext: offset + enrichedItems.length < total,
		};
	}

	private async getInventoryItemsPage(
		limit: number,
		offset: number,
	): Promise<PaginatedResult<InventoryItemResult>> {
		const [items, total] = await Promise.all([
			this.inventoryReader.findRecentItems(limit, offset),
			this.inventoryReader.countItems(),
		]);

		const totalPages = Math.max(1, Math.ceil(total / limit));

		return {
			items,
			offset,
			limit,
			total,
			totalPages,
			hasNext: offset + items.length < total,
		};
	}
}

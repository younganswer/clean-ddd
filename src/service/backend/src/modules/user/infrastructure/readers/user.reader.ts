import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IUserReaderSymbol,
	type IUserReader,
} from '@/modules/user/domains/readers/i.user.reader';
import type { PageOptions } from '@/lib/database/repository-get-options';
import { UserSchema } from '@/modules/user/infrastructure/schemas/user.schema';
import { UserApplicationUserNotFoundException } from '@/shared/exceptions';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { UserProfileResult } from '@/modules/user/domains/readers/user-profile.result';
import { normalizeReaderInternalPage } from '@/common/cqrs/pagination-policy';
import { useClassProvider } from '@/common/utils/nest-provider.helpers';

@Injectable()
export class UserReader implements IUserReader {
	constructor(private readonly em: EntityManager) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async findById(id: string): Promise<UserProfileResult | null> {
		const user = await this.emForContext().findOne(UserSchema, {
			uuid: id,
		});
		if (!user) return null;
		return UserProfileResult.fromSchema(user);
	}

	async getById(id: string): Promise<UserProfileResult> {
		const user = await this.emForContext().findOneOrFail(
			UserSchema,
			{ uuid: id },
			{
				failHandler: () =>
					ApplicationExceptionFactory.create(
						UserApplicationUserNotFoundException,
						{ cause: { id } },
					),
			},
		);
		return UserProfileResult.fromSchema(user);
	}

	async findRecent(
		options: PageOptions<UserProfileResult>,
	): Promise<UserProfileResult[]> {
		const page = normalizeReaderInternalPage(options.limit, options.offset);
		const rows = await this.emForContext().find(
			UserSchema,
			{},
			{
				limit: page.limit,
				offset: page.offset,
				orderBy: { id: 'asc' },
			},
		);
		return rows.map((row) => UserProfileResult.fromSchema(row));
	}

	async countAll(): Promise<number> {
		return await this.emForContext().count(UserSchema, {});
	}
}

export const UserReaderProvider = useClassProvider(
	IUserReaderSymbol,
	UserReader,
);

import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import {
	IUserReaderSymbol,
	type IUserReader,
} from '@/shared/readers/users/i.user.reader';
import { UserSchema } from '@/modules/users/infrastructure/schemas/user.schema';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';
import { UserProfileResult } from '@/shared/readers/users/user-profile.result';

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
					ApplicationErrorFactory.create(
						USER_APPLICATION_ERRORS.USER_NOT_FOUND,
						{ details: { id } },
					),
			},
		);
		return UserProfileResult.fromSchema(user);
	}

	async findAll(input: {
		limit: number;
		offset: number;
	}): Promise<UserProfileResult[]> {
		const limit = Math.min(
			200,
			Math.max(1, Number(input.limit ?? 20) || 20),
		);
		const offset = Math.max(0, Number(input.offset ?? 0) || 0);
		const rows = await this.emForContext().find(
			UserSchema,
			{},
			{
				limit,
				offset,
				orderBy: { id: 'asc' },
			},
		);
		return rows.map((row) => UserProfileResult.fromSchema(row));
	}

	async countAll(): Promise<number> {
		return await this.emForContext().count(UserSchema, {});
	}
}

export const UserReaderProvider = {
	provide: IUserReaderSymbol,
	useClass: UserReader,
};

import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';
import { User } from '@/modules/users/domains/entities/user.entity';
import type { IUserRepository } from '@/modules/users/domains/repositories/i.user.repository';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { UserSchema } from '@/modules/users/infrastructure/schemas/user.schema';
import { USER_APPLICATION_ERRORS } from '@/shared/errors';
import { ApplicationErrorFactory } from '@/shared/errors/base.error-factory';

@Injectable()
export class SqlUserRepository implements IUserRepository {
	constructor(
		private readonly em: EntityManager,
		private readonly mapper: UserMapper,
	) {}

	private emForContext(): EntityManager {
		return (
			(RequestContext.getEntityManager() as EntityManager | undefined) ??
			this.em
		);
	}

	async persist(user: User): Promise<void> {
		const em = this.emForContext();
		const schema = this.mapper.toSchema(user);
		const exists = await em.findOne(UserSchema, { uuid: user.id });

		if (exists) {
			em.assign(exists, schema, {
				ignoreUndefined: true,
				onlyProperties: true,
			});
		} else {
			em.create(UserSchema, schema);
		}
	}

	async getById(
		userId: string,
		options?: RepositoryGetByIdOptions,
	): Promise<User> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() => {
				throw ApplicationErrorFactory.create(
					USER_APPLICATION_ERRORS.USER_NOT_FOUND,
					{ details: { userId } },
				);
			});
		const user = await em.findOneOrFail(
			UserSchema,
			{ uuid: userId },
			{ failHandler },
		);

		return this.mapper.toDomain(user);
	}

	async findById(userId: string): Promise<User | null> {
		const em = this.emForContext();
		const user = await em.findOne(UserSchema, { uuid: userId });
		return user ? this.mapper.toDomain(user) : null;
	}

	async findAll(input: { limit: number; page: number }): Promise<User[]> {
		const limit = Math.min(
			200,
			Math.max(1, Number(input.limit ?? 20) || 20),
		);
		const page = Math.max(1, Number(input.page ?? 1) || 1);
		const offset = (page - 1) * limit;
		const em = this.emForContext();
		const rows = await em.find(
			UserSchema,
			{},
			{
				limit,
				offset: Math.max(0, offset),
				orderBy: { id: 'asc' },
			},
		);

		return rows.map((row) => this.mapper.toDomain(row));
	}

	async countAll(): Promise<number> {
		const em = this.emForContext();
		return await em.count(UserSchema, {});
	}
}

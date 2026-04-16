import { RequestContext } from '@mikro-orm/core';
import { EntityManager } from '@mikro-orm/postgresql';
import { Injectable } from '@nestjs/common';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';
import { User } from '@/modules/user/domains/entities/user.entity';
import {
	IUserRepositorySymbol,
	type IUserRepository,
} from '@/modules/user/domains/repositories/i.user.repository';
import { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
import { UserSchema } from '@/modules/user/infrastructure/schemas/user.schema';
import { UserApplicationUserNotFoundException } from '@/shared/exceptions';
import { SystemRequestContextTransactionRequiredException } from '@/shared/exceptions/catalogs/system.exception';
import { ApplicationExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { InfrastructureExceptionFactory } from '@/common/exceptions/base.exception-factory';
import { useClassProviders } from '@/common/utils/nest-provider.helpers';

@Injectable()
export class UserRepository implements IUserRepository {
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

	private transactionalEmForWrite(): EntityManager {
		const em = RequestContext.getEntityManager() as
			| EntityManager
			| undefined;
		if (!em) {
			throw InfrastructureExceptionFactory.create(
				SystemRequestContextTransactionRequiredException,
				{
					cause: {
						repository: UserRepository.name,
						method: 'persist',
					},
				},
			);
		}
		return em;
	}

	async persist(user: User): Promise<void> {
		const em = this.transactionalEmForWrite();
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
		id: string,
		options?: RepositoryGetByIdOptions,
	): Promise<User> {
		const em = this.emForContext();
		const failHandler =
			options?.failHandler ??
			(() =>
				ApplicationExceptionFactory.create(
					UserApplicationUserNotFoundException,
					{ cause: { id } },
				));
		const user = await em.findOneOrFail(
			UserSchema,
			{ uuid: id },
			{ failHandler },
		);

		return this.mapper.toDomain(user);
	}

	async findById(id: string): Promise<User | null> {
		const em = this.emForContext();
		const user = await em.findOne(UserSchema, { uuid: id });
		return user ? this.mapper.toDomain(user) : null;
	}

	async findRecent(options: RepositoryPageOptions<User>): Promise<User[]> {
		const { limit, offset = 0 } = options;
		const em = this.emForContext();
		const rows = await em.find(
			UserSchema,
			{},
			{
				limit,
				offset,
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

export const UserRepositoryProviders = useClassProviders(
	IUserRepositorySymbol,
	UserRepository,
);

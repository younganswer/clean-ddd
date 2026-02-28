import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserRepositorySymbol } from '@/modules/users/domains/repositories/i.user.repository';
import { SqlUserRepository } from '@/modules/users/infrastructure/repositories/sql-user.repository';
import { CommandHandlers } from '@/modules/users/application/commands';
import { QueryHandlers } from '@/modules/users/application/queries';
import { MeController } from '@/modules/users/presentation/me.controller';
import { UsersController } from '@/modules/users/presentation/users.controller';
import { IUserAvatarRepositorySymbol } from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { MongoUserAvatarRepository } from '@/modules/users/infrastructure/repositories/mongo-user-avatar.repository';
import { DynamoDbUserAvatarRepository } from '@/modules/users/infrastructure/repositories/dynamodb-user-avatar.repository';
import { AvatarMapper } from '@/modules/users/infrastructure/mappers/avatar.mapper';
import { UserMapper } from '@/modules/users/infrastructure/mappers/user.mapper';
import { optionalEnv } from '@/env';

@Module({
	imports: [CqrsModule],
	controllers: [MeController, UsersController],
	providers: [
		AvatarMapper,
		UserMapper,
		SqlUserRepository,
		MongoUserAvatarRepository,
		DynamoDbUserAvatarRepository,
		{
			provide: IUserRepositorySymbol,
			useExisting: SqlUserRepository,
		},
		{
			provide: IUserAvatarRepositorySymbol,
			useFactory: (
				mongoUserAvatarRepository: MongoUserAvatarRepository,
				dynamoDbUserAvatarRepository: DynamoDbUserAvatarRepository,
			) => {
				const nodeEnv = (
					optionalEnv('NODE_ENV') ?? 'development'
				).toLowerCase();
				const backend =
					optionalEnv('AVATAR_REPOSITORY_BACKEND') ??
					(nodeEnv === 'production' ? 'dynamodb' : 'mongo');
				return backend === 'dynamodb'
					? dynamoDbUserAvatarRepository
					: mongoUserAvatarRepository;
			},
			inject: [MongoUserAvatarRepository, DynamoDbUserAvatarRepository],
		},
		...CommandHandlers,
		...QueryHandlers,
	],
	exports: [IUserRepositorySymbol, IUserAvatarRepositorySymbol],
})
export class UsersModule {}

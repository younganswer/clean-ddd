import { useFactoryProviders } from '@/common/utils/nest-provider.helpers';
import { UserHandlers } from '@/modules/user/application';
import { IUserAvatarReaderSymbol } from '@/modules/user/domains/readers/i.user-avatar.reader';
import { IUserAvatarRepositorySymbol } from '@/modules/user/domains/repositories/i.user-avatar.repository';
import { AvatarMapper } from '@/modules/user/infrastructure/mappers/avatar.mapper';
import { UserMapper } from '@/modules/user/infrastructure/mappers/user.mapper';
import { DynamoDbUserAvatarReader } from '@/modules/user/infrastructure/readers/dynamodb-user-avatar.reader';
import { MongoUserAvatarReader } from '@/modules/user/infrastructure/readers/mongo-user-avatar.reader';
import { UserReaderProvider } from '@/modules/user/infrastructure/readers/user.reader';
import { DynamoDbUserAvatarRepository } from '@/modules/user/infrastructure/repositories/dynamodb-user-avatar.repository';
import { MongoUserAvatarRepository } from '@/modules/user/infrastructure/repositories/mongo-user-avatar.repository';
import { UserRepositoryProviders } from '@/modules/user/infrastructure/repositories/user.repository';
import { optionalEnv } from '@/shared/env';

export const UserProviders = [
	AvatarMapper,
	UserMapper,
	UserReaderProvider,
	...UserRepositoryProviders,
	...useFactoryProviders(
		IUserAvatarRepositorySymbol,
		(
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
		[MongoUserAvatarRepository, DynamoDbUserAvatarRepository] as const,
	),
	...useFactoryProviders(
		IUserAvatarReaderSymbol,
		(
			mongoUserAvatarReader: MongoUserAvatarReader,
			dynamoDbUserAvatarReader: DynamoDbUserAvatarReader,
		) => {
			const nodeEnv = (
				optionalEnv('NODE_ENV') ?? 'development'
			).toLowerCase();
			const backend =
				optionalEnv('AVATAR_REPOSITORY_BACKEND') ??
				(nodeEnv === 'production' ? 'dynamodb' : 'mongo');
			return backend === 'dynamodb'
				? dynamoDbUserAvatarReader
				: mongoUserAvatarReader;
		},
		[MongoUserAvatarReader, DynamoDbUserAvatarReader] as const,
	),
	...UserHandlers,
];

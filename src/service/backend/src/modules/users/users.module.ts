import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserProfileRepositorySymbol } from '@/modules/users/domains/repositories/i.user-profile.repository';
import { SqlUserProfileRepository } from '@/modules/users/infrastructure/repositories/sql-user-profile.repository';
import { CommandHandlers } from '@/modules/users/application/commands';
import { QueryHandlers } from '@/modules/users/application/queries';
import { MeController } from '@/modules/users/presentation/me.controller';
import { UsersController } from '@/modules/users/presentation/users.controller';
import { IUserAvatarRepositorySymbol } from '@/modules/users/domains/repositories/i.user-avatar.repository';
import { MongoUserAvatarRepository } from '@/modules/users/infrastructure/repositories/mongo-user-avatar.repository';
import { DynamoDbUserAvatarRepository } from '@/modules/users/infrastructure/repositories/dynamodb-user-avatar.repository';
import { IUserAvatarLinkRepositorySymbol } from '@/modules/users/domains/repositories/i.user-avatar-link.repository';
import { SqlUserAvatarLinkRepository } from '@/modules/users/infrastructure/repositories/sql-user-avatar-link.repository';
import { AvatarMapper } from '@/modules/users/infrastructure/mappers/avatar.mapper';
import { optionalEnv } from '@/env';

@Module({
  imports: [CqrsModule],
  controllers: [MeController, UsersController],
  providers: [
    AvatarMapper,
    SqlUserProfileRepository,
    MongoUserAvatarRepository,
    DynamoDbUserAvatarRepository,
    SqlUserAvatarLinkRepository,
    {
      provide: IUserProfileRepositorySymbol,
      useExisting: SqlUserProfileRepository,
    },
    {
      provide: IUserAvatarRepositorySymbol,
      useFactory: (
        mongoUserAvatarRepository: MongoUserAvatarRepository,
        dynamoDbUserAvatarRepository: DynamoDbUserAvatarRepository,
      ) => {
        const backend = optionalEnv('AVATAR_REPOSITORY_BACKEND') ?? 'mongo';
        return backend === 'dynamodb'
          ? dynamoDbUserAvatarRepository
          : mongoUserAvatarRepository;
      },
      inject: [MongoUserAvatarRepository, DynamoDbUserAvatarRepository],
    },
    {
      provide: IUserAvatarLinkRepositorySymbol,
      useExisting: SqlUserAvatarLinkRepository,
    },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [
    IUserProfileRepositorySymbol,
    IUserAvatarRepositorySymbol,
    IUserAvatarLinkRepositorySymbol,
  ],
})
export class UsersModule {}

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
import { IUserAvatarLinkRepositorySymbol } from '@/modules/users/domains/repositories/i.user-avatar-link.repository';
import { SqlUserAvatarLinkRepository } from '@/modules/users/infrastructure/repositories/sql-user-avatar-link.repository';
import { AvatarMapper } from '@/modules/users/infrastructure/mappers/avatar.mapper';

@Module({
  imports: [CqrsModule],
  controllers: [MeController, UsersController],
  providers: [
    AvatarMapper,
    SqlUserProfileRepository,
    MongoUserAvatarRepository,
    SqlUserAvatarLinkRepository,
    {
      provide: IUserProfileRepositorySymbol,
      useExisting: SqlUserProfileRepository,
    },
    {
      provide: IUserAvatarRepositorySymbol,
      useExisting: MongoUserAvatarRepository,
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

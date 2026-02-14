import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserProfileRepositorySymbol } from '@/modules/users/domains/repositories/i.user-profile.repository';
import { SqlUserProfileRepository } from '@/modules/users/infrastructure/repositories/sql-user-profile.repository';
import { QueryHandlers } from '@/modules/users/application/queries';
import { MeController } from '@/modules/users/presentation/me.controller';
import { UsersController } from '@/modules/users/presentation/users.controller';

@Module({
  imports: [CqrsModule],
  controllers: [MeController, UsersController],
  providers: [
    SqlUserProfileRepository,
    {
      provide: IUserProfileRepositorySymbol,
      useExisting: SqlUserProfileRepository,
    },
    ...QueryHandlers,
  ],
  exports: [IUserProfileRepositorySymbol],
})
export class UsersModule {}

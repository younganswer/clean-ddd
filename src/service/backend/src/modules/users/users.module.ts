import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserProfileRepositorySymbol } from './domains/repositories/i.user-profile.repository';
import { SqlUserProfileRepository } from './infrastructure/repositories/sql-user-profile.repository';
import { QueryHandlers } from './application/queries';
import { MeController } from './presentation/me.controller';
import { UsersController } from './presentation/users.controller';

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

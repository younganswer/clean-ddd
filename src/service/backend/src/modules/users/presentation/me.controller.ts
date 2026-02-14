import { Controller, Get } from '@nestjs/common';
import { QueryBus } from '@nestjs/cqrs';
import { AuthContextAccessor } from '../../../common/context/auth-context';
import { GetUserProfileQuery } from '../../../shared/users/queries/get-user-profile.query';
import type { UserProfileView } from '../../../shared/users/readers/user-profile.view';

@Controller('me')
export class MeController {
  constructor(
    private readonly queryBus: QueryBus,
    private readonly authContextAccessor: AuthContextAccessor,
  ) {}

  @Get()
  async getMyProfile(): Promise<UserProfileView> {
    const userId = this.authContextAccessor.getOrAnonymous().actor.userId;
    return await this.queryBus.execute(
      new GetUserProfileQuery(userId) as unknown as never,
    );
  }
}

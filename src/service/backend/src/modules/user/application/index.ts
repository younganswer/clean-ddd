import { UserCommandHandlers } from '@/modules/user/application/commands';
import { UserQueryHandlers } from '@/modules/user/application/queries';

export const UserHandlers = [...UserCommandHandlers, ...UserQueryHandlers];

import { GetUserProfileQueryHandler } from '@/modules/user/application/queries/get-user-profile.query-handler';
import { GetUserProfilesQueryHandler } from '@/modules/user/application/queries/list-user-profiles.query-handler';

export const UserQueryHandlers = [
	GetUserProfileQueryHandler,
	GetUserProfilesQueryHandler,
];

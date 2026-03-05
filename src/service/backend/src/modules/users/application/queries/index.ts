import { GetUserProfileQueryHandler } from '@/modules/users/application/queries/get-user-profile.query-handler';
import { GetUserProfilesQueryHandler } from '@/modules/users/application/queries/list-user-profiles.query-handler';

export const QueryHandlers = [
	GetUserProfileQueryHandler,
	GetUserProfilesQueryHandler,
];

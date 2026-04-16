import type { PageOptions } from '@/lib/database/repository-get-options';
import type { UserProfileResult } from '@/modules/user/domains/readers/user-profile.result';

export const IUserReaderSymbol = Symbol('IUserReader');

export interface IUserReader {
	findById(id: string): Promise<UserProfileResult | null>;
	getById(id: string): Promise<UserProfileResult>;
	findRecent(
		options: PageOptions<UserProfileResult>,
	): Promise<UserProfileResult[]>;
	countAll(): Promise<number>;
}

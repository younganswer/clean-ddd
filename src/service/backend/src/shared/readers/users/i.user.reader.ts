import type { UserProfileResult } from '@/shared/readers/users/user-profile.result';

export const IUserReaderSymbol = Symbol('IUserReader');

export interface IUserReader {
	findById(id: string): Promise<UserProfileResult | null>;
	getById(id: string): Promise<UserProfileResult>;
	findAll(input: {
		limit: number;
		offset: number;
	}): Promise<UserProfileResult[]>;
	countAll(): Promise<number>;
}

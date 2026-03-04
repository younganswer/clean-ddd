import { User } from '@/modules/users/domains/entities/user.entity';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export const IUserRepositorySymbol = Symbol('IUserRepository');

export interface IUserRepository {
	persist(user: User): Promise<void>;
	findById(userId: string): Promise<User | null>;

	getById(userId: string, options?: RepositoryGetByIdOptions): Promise<User>;

	findAll(input: { limit: number; page: number }): Promise<User[]>;

	countAll(): Promise<number>;
}

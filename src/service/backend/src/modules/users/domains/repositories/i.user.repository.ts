import { User } from '@/modules/users/domains/entities/user.entity';
import type { RepositoryGetByIdOptions } from '@/lib/database/repository-get-options';

export const IUserRepositorySymbol = Symbol('IUserRepository');

export interface IUserRepository {
	persist(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	getById(id: string, options?: RepositoryGetByIdOptions): Promise<User>;
	findAll(input: { limit: number; offset: number }): Promise<User[]>;
	countAll(): Promise<number>;
}

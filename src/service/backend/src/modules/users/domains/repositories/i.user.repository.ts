import { User } from '@/modules/users/domains/entities/user.entity';

export const IUserRepositorySymbol = Symbol('IUserRepository');

export interface IUserRepository {
	persist(user: User): Promise<void>;

	findById(userId: string): Promise<User | null>;

	findAll(input: { limit: number; page: number }): Promise<User[]>;

	countAll(): Promise<number>;
}

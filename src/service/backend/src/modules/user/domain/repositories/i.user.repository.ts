import { User } from '@/modules/user/domain/entities/user.entity';
import type {
	RepositoryGetByIdOptions,
	RepositoryPageOptions,
} from '@/lib/database/repository-get-options';

export const IUserRepositorySymbol = Symbol('IUserRepository');

export interface IUserRepository {
	persist(user: User): Promise<void>;
	findById(id: string): Promise<User | null>;
	getById(id: string, options?: RepositoryGetByIdOptions): Promise<User>;
	findRecent(options: RepositoryPageOptions<User>): Promise<User[]>;
	countAll(): Promise<number>;
}

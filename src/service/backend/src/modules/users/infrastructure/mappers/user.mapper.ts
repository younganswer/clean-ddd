import { Injectable } from '@nestjs/common';
import { UserSchema } from '../schemas/user.schema';
import { User } from '../../domains/entities/user.entity';

@Injectable()
export class UserMapper {
	toDomain(schema: UserSchema): User {
		return User.rehydrate({
			uuid: schema.uuid,
			displayName: schema.displayName,
			email: schema.email,
			avatarId: schema.avatarId,
		});
	}

	toSchema(user: User): UserSchema {
		const primitives = user.toPrimitives();

		return new UserSchema({
			uuid: primitives.userId,
			displayName: primitives.displayName,
			email: primitives.email,
			avatarId: primitives.avatarId,
		});
	}
}

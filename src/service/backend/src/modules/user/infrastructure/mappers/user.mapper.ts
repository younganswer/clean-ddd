import { Injectable } from '@nestjs/common';
import { User } from '@/modules/user/domain/entities/user.entity';
import { UserSchema } from '@/modules/user/infrastructure/schemas/user.schema';

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

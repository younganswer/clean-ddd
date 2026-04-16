import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserAvatarReaderSymbol } from '@/modules/user/domain/readers/i.user-avatar.reader';
import { IUserReaderSymbol } from '@/modules/user/domain/readers/i.user.reader';
import { UserProviders } from '@/modules/user/domain';
import { UserControllers } from '@/modules/user/presentation';

const UserImports = [CqrsModule];

const UserExports = [IUserReaderSymbol, IUserAvatarReaderSymbol];

@Module({
	imports: UserImports,
	controllers: UserControllers,
	providers: UserProviders,
	exports: UserExports,
})
export class UserModule {}

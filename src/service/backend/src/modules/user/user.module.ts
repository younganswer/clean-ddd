import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { IUserAvatarReaderSymbol } from '@/modules/user/domains/readers/i.user-avatar.reader';
import { IUserReaderSymbol } from '@/modules/user/domains/readers/i.user.reader';
import { UserProviders } from '@/modules/user/domains';
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

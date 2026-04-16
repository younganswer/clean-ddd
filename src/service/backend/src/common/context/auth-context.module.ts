import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthContextAccessor } from '@/common/context/auth-context';

const AuthContextProviders = [AuthContextAccessor, AuthGuard];

const AuthContextExports = [AuthContextAccessor, AuthGuard];

@Global()
@Module({
	providers: AuthContextProviders,
	exports: AuthContextExports,
})
export class AuthContextModule {}

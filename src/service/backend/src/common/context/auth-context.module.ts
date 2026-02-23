import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '@/common/guards/auth.guard';
import { AuthContextAccessor } from '@/common/context/auth-context';

@Global()
@Module({
	providers: [AuthContextAccessor, AuthGuard],
	exports: [AuthContextAccessor, AuthGuard],
})
export class AuthContextModule {}

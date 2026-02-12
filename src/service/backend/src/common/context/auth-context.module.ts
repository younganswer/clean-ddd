import { Global, Module } from '@nestjs/common';
import { AuthGuard } from '../guards/auth.guard';
import { AuthContextAccessor } from './auth-context';

@Global()
@Module({
  providers: [AuthContextAccessor, AuthGuard],
  exports: [AuthContextAccessor, AuthGuard],
})
export class AuthContextModule {}

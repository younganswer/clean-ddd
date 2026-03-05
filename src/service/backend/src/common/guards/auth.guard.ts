import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthContextAccessor } from '@/common/context/auth-context';

@Injectable()
export class AuthGuard implements CanActivate {
	constructor(private readonly authContextAccessor: AuthContextAccessor) {}

	canActivate(context: ExecutionContext): boolean {
		const req = context.switchToHttp().getRequest<Request>();
		const header = req.headers['x-user-id'];
		const userIdRaw = Array.isArray(header) ? header[0] : header;
		const userId = (userIdRaw ?? '').trim();

		this.authContextAccessor.setActor({
			userId: userId.length > 0 ? userId : 'anonymous',
			type: userId.length > 0 ? 'user' : 'anonymous',
		});

		return true;
	}
}

import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthContextAccessor } from '@/common/context/auth-context';

/**
 * docs-first placeholder guard.
 *
 * camp 스타일에서는 전역 AuthGuard를 두되, 이 샘플 프로젝트에서는 인증 구현이 없으므로
 * 기능을 유지하기 위해 기본값은 항상 true(통과)로 둡니다.
 */
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

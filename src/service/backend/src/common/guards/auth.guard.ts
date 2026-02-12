import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';
import type { Request } from 'express';
import { AuthContextAccessor } from '../context/auth-context';

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
    const header = req.headers['x-subject-id'];
    const subjectIdRaw = Array.isArray(header) ? header[0] : header;
    const subjectId = (subjectIdRaw ?? '').trim();

    this.authContextAccessor.setActor({
      subjectId: subjectId.length > 0 ? subjectId : 'anonymous',
      type: subjectId.length > 0 ? 'user' : 'anonymous',
    });

    return true;
  }
}

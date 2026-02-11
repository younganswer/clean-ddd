import { CanActivate, ExecutionContext, Injectable } from '@nestjs/common';

/**
 * docs-first placeholder guard.
 *
 * camp 스타일에서는 전역 AuthGuard를 두되, 이 샘플 프로젝트에서는 인증 구현이 없으므로
 * 기능을 유지하기 위해 기본값은 항상 true(통과)로 둡니다.
 */
@Injectable()
export class AuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    void context;
    return true;
  }
}

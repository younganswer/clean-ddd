# backend tests

이 디렉터리는 `src/service/backend`의 테스트를 모아두는 위치이며, 테스트 레이어(단위/시나리오/DB/E2E)를 폴더 구조로 표현합니다.

테스트 전략의 개념 설명은 다음 문서에서 소개합니다.

- [docs/concepts/backend/testing-strategy.md](/docs/concepts/backend/testing-strategy.md)

## 레이어(폴더) 구조

- `tests/units/**`
  - 외부 인프라 없이도 설명 가능한 규칙/로직을 둡니다.
- `tests/db/**`
  - MikroORM + 실제 Postgres를 포함한 통합 관점의 테스트를 둡니다.
- `tests/*.e2e-spec.ts`
  - HTTP 경계까지 포함한 형태의 테스트를 둡니다.

현재 저장소에는 `tests/scenarios/**`가 아직 없습니다.
여러 규칙의 조합/흐름 테스트가 필요해지면 해당 레이어를 추가해 확장합니다.

## GWT 스타일

테스트는 `Given / When / Then`(GWT) 형태로 서술합니다.

- 템플릿/헬퍼: `test-utils/gwt.template.spec.ts`

## 스크립트(참고)

테스트 실행 스크립트는 backend 패키지의 `package.json`에 정의되어 있습니다.

```bash
pnpm -C src/service/backend test:fast
pnpm -C src/service/backend test:db
pnpm -C src/service/backend test:e2e
```

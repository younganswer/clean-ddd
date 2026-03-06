# contracts

`src/packages/contracts`는 애플리케이션 간 통합 경계에서 공유되는 산출물을 모아두는 패키지입니다.

## 포함되는 것

- OpenAPI 스펙
- API 호출/응답 형태를 표현하는 공유 타입

## 포함되지 않는 것

- 백엔드의 도메인 모델(업무 규칙을 담는 객체)

## 이 저장소에서의 형태

- 도메인 API OpenAPI: `src/packages/contracts/specs/openapi.yaml`
- BFF API OpenAPI: `src/packages/contracts/specs/openapi.bff.yaml`
- 생성 타입 엔트리: `src/packages/contracts/generated/api/types.generated.ts`
- 생성 BFF 타입 엔트리: `src/packages/contracts/generated/bff/types.bff.generated.ts`
- 생성 타입 sections: `src/packages/contracts/generated/api/sections/*.ts`
- 생성 BFF 타입 sections: `src/packages/contracts/generated/bff/sections/*.ts`
- 컴포넌트 sections: `src/packages/contracts/generated/*/sections/components/index.ts` + `core.ts` + `schemas/*.ts`
- 패스 sections: `src/packages/contracts/generated/*/sections/paths.ts` + `paths/model.ts` + `paths/routes/*.ts`
- 통합 generated 엔트리: `src/packages/contracts/generated/index.ts`
- 타입 진입점: `src/packages/contracts/index.ts`

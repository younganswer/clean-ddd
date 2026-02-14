# contracts

`src/packages/contracts`는 애플리케이션 간 통합 경계에서 공유되는 산출물을 모아두는 패키지입니다.

## 포함되는 것

- OpenAPI 스펙
- API 호출/응답 형태를 표현하는 공유 타입

## 포함되지 않는 것

- 백엔드의 도메인 모델(업무 규칙을 담는 객체)

## 이 저장소에서의 형태

- OpenAPI: `src/packages/contracts/openapi.yaml`
- 타입 진입점: `src/packages/contracts/index.ts`

## 관련 문서

- 문서 허브: [docs/index.md](../../../docs/index.md)
- 개념 문서: [OpenAPI와 공유 타입](../../../docs/concepts/contracts/openapi-and-shared-types.md)

# 테스트 전략(백엔드)

이 문서는 `src/service/backend`의 테스트를 어떤 관점으로 나누고, 각 테스트가 무엇을 설명하는지 소개합니다.

## 개요

백엔드 테스트는 크게 두 축으로 나누어 이해할 수 있습니다.

- 설명하려는 대상: 규칙(로직) / 조합(흐름) / 통합(인프라) / 시스템(엔드-투-엔드)
- 실행 특성: 빠르게 반복되는 테스트 vs 외부 의존(DB 등)을 포함하는 테스트

> 현재 저장소에는 `tests/scenarios/**`가 아직 도입되어 있지 않으며,
> 조합/흐름 관점 테스트는 일부가 `tests/units/**`와 `tests/*.e2e-spec.ts`에 분산되어 있습니다.

## 폴더로 표현되는 레이어

`src/service/backend/tests` 아래의 구조는 다음과 같은 의미로 사용됩니다.

- `tests/units/**`
    - 외부 인프라 없이도 성립하는 규칙/로직을 설명합니다.
- `tests/db/**`
    - MikroORM/SQL/스키마/쿼리 같은 영속성 계층의 정합성을 설명합니다.
- `tests/*.e2e-spec.ts`
    - HTTP 경계까지 포함한 end-to-end 형태의 테스트를 둡니다.

`tests/scenarios/**`는 필요 시 도입 가능한 확장 레이어로 유지합니다.

## GWT 스타일

테스트의 서술 방식으로 `Given / When / Then`(GWT)을 사용합니다. 이 저장소에는 이를 위한 템플릿/헬퍼가 포함되어 있습니다.

## 환경과 실행 특성

DB 통합 테스트는 별도의 opt-in 환경변수(예: `RUN_DB_TESTS`)로 활성화되는 형태로 구성되어 있습니다. 이는 “테스트를 어떤 종류로 보는가”를 코드/스크립트 수준에서 구분하는 방식으로 이해할 수 있습니다.

## 함께 읽기

- 백엔드 테스트 README: [src/service/backend/tests/README.md](../../../src/service/backend/tests/README.md)
- 문서 허브: [docs/index.md](../../index.md)

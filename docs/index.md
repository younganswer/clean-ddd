# 문서

이 디렉터리는 clean-ddd 저장소를 위한 **개념 중심 문서**를 제공합니다.

이 문서들은 코드베이스에 나타나는 기술적 구조, 경계, 흐름을 소개하는 것을 목표로 합니다. 업무/도메인 자체 소개는 범위에서 제외합니다.

## 문서 권한

- 개념/아키텍처 원문은 `docs/`를 기준으로 유지합니다.
- 디렉터리별 README는 실행 맥락/탐색 가이드를 제공합니다.
- 디렉터리 하위 `docs/`는 보조 메모 성격으로 제한합니다.

## 개요

- [시스템 한눈에 보기](system-at-a-glance.md)
- [런타임 토폴로지](runtime-topology.md)
- [데이터 흐름](data-flows.md)
- [컨셉 맵](concept-map.md)

## 런타임 부록

- [Runtime Appendix](runtime-appendix.md)

## 영역별 컨셉

### 백엔드

- [백엔드 개념 허브](concepts/backend/index.md)
- [프로세스 모델](concepts/backend/process-model.md)
- [Outbox 패턴(본 저장소 구현)](concepts/backend/outbox-pattern.md)
- [테스트 전략(백엔드)](concepts/backend/testing-strategy.md)

### 프론트엔드

- [본 저장소의 Next.js 모델](concepts/frontend/nextjs-model.md)

### 인프라

- [SAM 개요](concepts/infra/sam-overview.md)
- [SAM 리소스 매핑](concepts/infra/sam-resource-mapping.md)

### 계약(Contracts)

- [OpenAPI와 공유 타입](concepts/contracts/openapi-and-shared-types.md)

## 디렉터리 레벨 가이드

코드 디렉터리에서 바로 문맥을 파악하려면 아래 README부터 확인하세요.

- [src 가이드](../src/README.md)
- [service 가이드](../src/service/README.md)
- [backend 가이드](../src/service/backend/README.md)
- [packages 가이드](../src/packages/README.md)
- [infra 가이드](../src/infra/README.md)
- [stack 가이드](../src/stack/README.md)

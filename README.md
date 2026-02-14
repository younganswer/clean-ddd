# clean-ddd

`clean-ddd`는 **Clean Architecture + Domain-Driven Design(DDD)**를 실제 코드 예시와 함께 정리한 레퍼런스 저장소입니다.

이 저장소는 특정 비즈니스 도메인 설명보다, 설계/구현 패턴을 재사용 가능한 형태로 정리하는 데 초점을 둡니다.

- 계층 경계와 의존성 방향을 유지하는 백엔드 구조
- 동기(HTTP) + 비동기(SQS/Outbox) 처리 모델
- 계약(contracts) 기반의 서비스 간/레이어 간 연결

## Documentation overview

### 1) 프로젝트 전체 개요

- [문서 허브](docs/index.md)
- [시스템 한눈에 보기](docs/system-at-a-glance.md)
- [런타임 토폴로지](docs/runtime-topology.md)

### 2) Clean Architecture/DDD 정리 (백엔드 중심)

- [backend 문서 시작점](src/service/backend/README.md)
- [백엔드 개념 허브](docs/concepts/backend/index.md)

> Clean Architecture/DDD 핵심 원문은 `docs/concepts/backend/`를 기준으로 관리합니다.

### 3) 실행/운영 관점

- [런타임 부록](docs/runtime-appendix.md)

## 저장소 구조

- `src/`: 실행 가능한 워크스페이스 루트
- `src/service/`: backend / frontend 서비스
- `src/packages/`: 공용 패키지(contracts)
- `src/infra/`: SAM 템플릿 및 인프라 정의
- `src/stack/`: 로컬 실행용 compose/localstack/nginx 구성

## 문서 원칙

- 개념 기준 문서: `docs/`
- 코드 근접 가이드: 각 디렉터리의 `README.md`
- 운영/도구 정보는 `docs/runtime-appendix.md`로 제한

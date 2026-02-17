# clean-ddd

`clean-ddd`는 <strong>Clean Architecture + Domain-Driven Design(DDD)</strong>를 실제 코드 예시와 함께 정리한 레퍼런스 저장소입니다.

이 저장소는 특정 비즈니스 도메인 설명보다, 설계/구현 패턴을 재사용 가능한 형태로 정리하는 데 초점을 두고 있습니다. 주요 특징은 다음과 같습니다:

- 계층 경계와 의존성 방향을 유지하는 백엔드 구조
- 동기(HTTP) + 비동기(SQS/Outbox) 처리 모델
- 계약(contracts) 기반의 서비스 간/레이어 간 연결

<br/>
<br/>

## 목차

1. [문서 안내](#문서-안내)
2. [저장소 구조](#저장소-구조)

<br/>
<br/>

## 문서 안내

### 1) 전체 개요

- [시스템 한눈에 보기](docs/system-at-a-glance.md)
- [런타임 토폴로지](docs/runtime-topology.md)

### 2) 아키텍처 기준 (백엔드 중심)

- [backend 문서 시작점](src/service/backend/README.md)
- [Clean Architecture + DDD 통합 문서](docs/clean-architecture-ddd.md)
- [도메인 간 연동 패턴](docs/backend-integration-patterns.md)
- [RequestContext + Unit of Work](docs/request-context-unit-of-work.md)
- [BFF Boundary Playbook](docs/bff-boundary-playbook.md)
- [Write/Read Implementation Playbook](docs/write-read-implementation-playbook.md)

### 3) 실행/운영 관점

- [데이터 흐름](docs/data-flows.md)

<br/>
<br/>

## 저장소 구조

- `src/`: 실행 가능한 워크스페이스 루트
- `src/service/`: backend / frontend 서비스
- `src/packages/`: 공용 패키지(contracts)
- `src/infra/`: SAM 템플릿 및 인프라 정의
- `src/stack/`: 로컬 실행용 compose, localstack, nginx 구성

<br/>
<br/>

## 배포

- Production URL: https://d1qhe6m43bntsj.cloudfront.net

서버리스 온디맨드 배포 기준:

- backend: AWS Lambda + API Gateway + SQS + DynamoDB(PAY_PER_REQUEST)
- postgres: Neon (serverless)
- frontend: Next static export → S3 + CloudFront

GitHub repository 환경변수 등록(민감값/일반값 분리):

```bash
.github/scripts/register-env.sh younganswer/clean-ddd dev .github/env/dev.vars .github/env/dev.secrets https://example.com
```

상세 배포 흐름은 [src/infra/README.md](src/infra/README.md)를 참고합니다.

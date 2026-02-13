# 문서

이 디렉터리는 clean-ddd 저장소를 위한 **개념 중심 문서**를 제공합니다.

이 문서들은 코드베이스에 나타나는 기술적 구조, 경계, 흐름을 소개하는 것을 목표로 합니다. 업무/도메인 자체 소개는 범위에서 제외합니다.

## 개요

- [시스템 한눈에 보기](system-at-a-glance.md)
- [런타임 토폴로지](runtime-topology.md)
- [데이터 흐름](data-flows.md)
- [컨셉 맵](concept-map.md)

## 사용법/배포

- [개발 환경 실행 및 사용법](usage.md)
- [배포 가이드](deploy.md)

## 영역별 컨셉

### 백엔드

- [프로세스 모델](concepts/backend/process-model.md)
- [Nest 애플리케이션 모델](concepts/backend/nest-application-model.md)
- [영속성과 MikroORM](concepts/backend/persistence-and-mikro-orm.md)
- [RequestContext와 EntityManager](concepts/backend/request-context-and-entity-manager.md)
- [Outbox 패턴(본 저장소 구현)](concepts/backend/outbox-pattern.md)
- [SQS FIFO와 멱등성](concepts/backend/sqs-fifo-and-idempotency.md)
- [서버리스 엔트리포인트](concepts/backend/serverless-entrypoints.md)
- [테스트 전략(백엔드)](concepts/backend/testing-strategy.md)

### 프론트엔드

- [본 저장소의 Next.js 모델](concepts/frontend/nextjs-model.md)

### 인프라

- [SAM 개요](concepts/infra/sam-overview.md)
- [SAM 리소스 매핑](concepts/infra/sam-resource-mapping.md)

### 계약(Contracts)

- [OpenAPI와 공유 타입](concepts/contracts/openapi-and-shared-types.md)

### 도구

- [LocalStack SQS](concepts/tools/localstack-sqs.md)

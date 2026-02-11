# backend

`apps/backend`는 NestJS 기반의 백엔드 애플리케이션입니다.

이 저장소의 백엔드는 단일 코드베이스를 여러 실행 역할(role)로 구동하는 형태를 갖습니다. 예를 들어, 동일한 `dist/src/main.js`가 HTTP API로도 실행되고, cron/scheduler 역할로도 실행되며, SQS 폴링 워커 역할로도 실행됩니다.

## 주요 구성요소

- NestJS 애플리케이션 부팅/구성
- MikroORM 기반 영속성
- Outbox 패턴 기반 비동기 처리
- SQS FIFO(LocalStack/AWS) 연동
- 서버리스 엔트리포인트(HTTP/SQS)

## 관련 문서

문서 허브는 루트의 [docs/index.md](../../docs/index.md)입니다. 백엔드 관련 문서는 아래에서 시작하시면 됩니다.

- [프로세스 모델](../../docs/concepts/backend/process-model.md)
- [Nest 애플리케이션 모델](../../docs/concepts/backend/nest-application-model.md)
- [영속성과 MikroORM](../../docs/concepts/backend/persistence-and-mikro-orm.md)
- [RequestContext와 EntityManager](../../docs/concepts/backend/request-context-and-entity-manager.md)
- [Outbox 패턴(본 저장소 구현)](../../docs/concepts/backend/outbox-pattern.md)
- [SQS FIFO와 멱등성](../../docs/concepts/backend/sqs-fifo-and-idempotency.md)
- [서버리스 엔트리포인트](../../docs/concepts/backend/serverless-entrypoints.md)

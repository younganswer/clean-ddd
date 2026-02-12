# backend

`src/service/backend`는 NestJS 기반의 백엔드 애플리케이션입니다.

이 저장소의 백엔드는 단일 코드베이스를 여러 실행 역할(role)로 구동하는 형태를 갖습니다. 예를 들어, 동일한 `dist/src/main.js`가 HTTP API로도 실행되고, cron/scheduler 역할로도 실행되며, SQS 폴링 워커 역할로도 실행됩니다.

## 주요 구성요소

- NestJS 애플리케이션 부팅/구성
- MikroORM 기반 영속성
- Outbox 패턴 기반 비동기 처리
- SQS FIFO(LocalStack/AWS) 연동
- 서버리스 엔트리포인트(HTTP/SQS)

## 로컬 DB 초기화/기본 데이터

Docker 기반(Postgres) 로컬 DB를 **초기화 후 마이그레이션 + seed(기본 더미 데이터)** 까지 한 번에 적용하려면 아래를 실행합니다.

- 초기화(볼륨 삭제) + 마이그레이션/seed: `pnpm db:reset:local`
- (볼륨 유지) 기동 + 마이그레이션/seed: `pnpm db:setup:local`

마이그레이션은 같은 DB에 대해 한 번만 적용되며, 앱을 실행하면서 주문/배송 데이터가 추가되면 초기 seed 위에 계속 쌓일 수 있습니다.
로컬 개발/데모 목적의 "정확한" 초기 상태(예: users 100, orders 1000, shipments 1000, 재고 총 100000 중 1000 예약)를 원하면 seed를 **replace** 하는 스크립트를 실행하세요.

- seed만 다시 적용(replace): `pnpm db:seed:local`

기본 접속 정보는 `postgresql://app:app@localhost:54322/clean_ddd`이며, 포트 충돌 등이 있으면 `DATABASE_URL` 환경변수로 바꿀 수 있습니다.

## 관련 문서

문서 허브는 루트의 [docs/index.md](/docs/index.md)입니다. 백엔드 관련 문서는 아래에서 시작하시면 됩니다.

- [프로세스 모델](/docs/concepts/backend/process-model.md)
- [Nest 애플리케이션 모델](/docs/concepts/backend/nest-application-model.md)
- [영속성과 MikroORM](/docs/concepts/backend/persistence-and-mikro-orm.md)
- [RequestContext와 EntityManager](/docs/concepts/backend/request-context-and-entity-manager.md)
- [Outbox 패턴(본 저장소 구현)](/docs/concepts/backend/outbox-pattern.md)
- [SQS FIFO와 멱등성](/docs/concepts/backend/sqs-fifo-and-idempotency.md)
- [서버리스 엔트리포인트](/docs/concepts/backend/serverless-entrypoints.md)

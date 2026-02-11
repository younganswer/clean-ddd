# clean-ddd Repository Design Review + RFC Feedback

> Audience: 이 시스템을 설계/구현한 실무자
>
> Scope: **새 피드백 문서 작성** (기존 산출물/문서 수정은 비범위)
>
> Rule: 각 토픽은 **DR(Design Review: 현재 설계 검증)** → **RFC(Refactor/Change Proposal: 개선 제안)** 순서로 작성

---

## How to read / How to write

- **DR 섹션**은 “현재 설계의 주장(Claim)”을 명시하고, 코드/설정 근거(Evidence)를 붙인 뒤, 리스크/갭과 검증 질문을 남깁니다.
- **RFC 섹션**은 DR에서 드러난 리스크/갭을 해결하기 위한 “목표(Goal) → 제안(Proposal) → 대안(Options) → 마이그레이션(Migration) → 검증(Validation)”을 작성합니다.
- **인프라/배포 관련 피드백은 코드 정리(Alignment) 완료 후 작성**합니다. 정리 전에는 결론 대신 체크리스트와 관찰 포인트만 남깁니다.

---

## 0. Executive Summary

### DR

- Strengths (3–5):
  - 
- Top risks (3–5):
  - 

### RFC

- Proposed changes (3–5):
  - 
- Migration headline (effort/impact):
  - 

---

## 1. Domain Model & Ubiquitous Language (UL)

### DR — Claim / Evidence / Risk / Questions

- Claim:
  - (예: “Ordering 컨텍스트가 Order 라이프사이클과 상태 전이를 소유한다”)
- Evidence (code anchors):
  - Ordering aggregate: ../../apps/backend/src/modules/ordering/domains/entities/aggregates/order/order.aggregate.ts
  - Payment intent aggregate: ../../apps/backend/src/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate.ts
  - Shipment aggregate: ../../apps/backend/src/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate.ts
  - Inventory entities: ../../apps/backend/src/modules/inventory/domains/entities
- Risks / gaps:
  - (예: 용어 충돌, 상태 모델 불명확, 컨텍스트 간 의미가 다른 동일 용어)
- Open questions:
  - (예: “Payment” vs “PaymentIntent”의 UL 상 정의와 경계는?)

### RFC — Goal / Proposal / Options / Migration / Validation

- Goal:
  - 
- Proposal:
  - 
- Options:
  - A) 
  - B) 
- Migration:
  - 
- Validation:
  - 

### UL Glossary (starter)

| Term | Definition (canonical) | Context | Source anchors | Notes (synonyms / banned terms) |
|---|---|---|---|---|
| Order |  | Ordering | ../../apps/backend/src/modules/ordering/domains/entities/aggregates/order/order.aggregate.ts |  |
| Money |  | Ordering | ../../apps/backend/src/modules/ordering/domains/value-objects/money.vo.ts |  |
| PaymentIntent |  | Payments | ../../apps/backend/src/modules/payments/domains/entities/aggregates/payment-intent/payment-intent.aggregate.ts |  |
| Shipment |  | Shipping | ../../apps/backend/src/modules/shipping/domains/entities/aggregates/shipment/shipment.aggregate.ts |  |
| InventoryReservation |  | Inventory | ../../apps/backend/src/modules/inventory/domains/entities/inventory-reservation.entity.ts |  |
| OutboxEvent |  | Outbox | ../../apps/backend/src/shared/outbox/domain/dto/outbox-event.dto.ts |  |

### Command / Query Catalog (starter)

| Name | Intent | Input | Output | Handler / Query handler | Invariants touched |
|---|---|---|---|---|---|
| CreateOrder |  |  |  | ../../apps/backend/src/modules/ordering/application/commands/handlers/create-order.handler.ts |  |
| AttachPaymentToOrder |  |  |  | ../../apps/backend/src/modules/ordering/application/commands/handlers/attach-payment-to-order.handler.ts |  |
| MarkOrderPaid |  |  |  | ../../apps/backend/src/modules/ordering/application/commands/handlers/mark-order-paid.handler.ts |  |
| CreatePaymentIntent |  |  |  | ../../apps/backend/src/modules/payments/application/commands/handlers/create-payment-intent.handler.ts |  |

### Event Catalog (starter)

> Note: 이벤트가 “business fact”인지 “integration request(명령형)”인지 분류 기준을 먼저 합의하고 작성합니다.

| Event type / Name | Classification | Producer | Consumer(s) | Handler(s) | Ordering / idempotency notes |
|---|---|---|---|---|---|
| ReserveInventoryForOrderRequested | integration request? | Ordering? / Outbox? | Inventory | ../../apps/backend/src/modules/inventory/application/events/handlers/reserve-inventory-for-order-requested.handler.ts |  |
| CreateShipmentForOrderRequested | integration request? | Ordering? / Outbox? | Shipping | ../../apps/backend/src/modules/shipping/application/events/handlers/create-shipment-for-order-requested.handler.ts |  |

---

## 2. Bounded Contexts & Module Boundaries

### DR

- Current contexts (observed):
  - Ordering: ../../apps/backend/src/modules/ordering
  - Payments: ../../apps/backend/src/modules/payments
  - Inventory: ../../apps/backend/src/modules/inventory
  - Shipping: ../../apps/backend/src/modules/shipping
  - Outbox (shared + module): ../../apps/backend/src/modules/outbox, ../../apps/backend/src/shared/outbox
- Cross-context dependencies to verify:
  - (예: Ordering이 Payments/Shipping/Inventory의 내부 타입을 직접 참조하는가?)

### RFC

- Boundary rules proposal:
  - (예: shared/contracts에는 ‘외부 경계 타입’만; 도메인 내부 타입은 절대 공유하지 않기)

---

## 3. Core Flows (Happy path + Failure path)

### DR

- Flow 1: “Order 생성 → 결제 인텐트 연결 → 결제 성공 → 재고/배송 요청”
  - HTTP entry: ../../apps/backend/src/modules/ordering/presentation/orders.controller.ts
  - Payment intents API: ../../apps/backend/src/modules/payments/presentation/payment-intents.controller.ts
  - Ordering handlers: ../../apps/backend/src/modules/ordering/application/commands/handlers
  - Outbox sweep/dispatch: ../../apps/backend/src/shared/outbox
- Failure modes checklist:
  - 중복 웹훅/중복 메시지
  - 순서 역전
  - partial failure (DB commit 성공 + publish 실패)

### RFC

- 개선 방향(예):
  - Idempotency 키 설계 표준화
  - 이벤트 타입/의미 정리(요청형 vs 사실형)

---

## 4. API Contract & Read Models

### DR

- OpenAPI source of truth candidate:
  - ../../packages/contracts/openapi.yaml
- Controllers:
  - Orders: ../../apps/backend/src/modules/ordering/presentation/orders.controller.ts
  - Payments: ../../apps/backend/src/modules/payments/presentation
  - Shipments: ../../apps/backend/src/modules/shipping/presentation/shipments.controller.ts
- Read-model readers/mappers:
  - Ordering: ../../apps/backend/src/modules/ordering/infrastructure/readers/order.reader.ts

### RFC

- Contract drift prevention proposal:
  - (예: OpenAPI 기반 생성/검증, CI에서 스펙-라우트 불일치 검출)

---

## 5. Persistence & Messaging (DB + Outbox + SQS)

### DR

- Local infra:
  - ../../docker-compose.local.yml
- DB & migrations:
  - ../../apps/backend/mikro-orm.config.ts
  - ../../apps/backend/migrations
- Outbox core:
  - Shared outbox module: ../../apps/backend/src/shared/outbox/outbox.module.ts
  - SQS poller: ../../apps/backend/src/shared/outbox/infrastructure/sqs/outbox.sqs-poller.ts
  - Event registry: ../../apps/backend/src/lib/outbox/event-registry.ts

### RFC

- Consistency policy proposal:
  - (예: at-least-once + dedup + idempotent handlers 규격화, retry/backoff 기준)

---

## 6. Runtime Topology & Process Model (PM2)

### DR

- Process definitions:
  - ../../ecosystem.dev.config.cjs
- Observations to validate:
  - HTTP API (cluster) vs cron (fork) vs queue poller (fork)로 역할 분리
  - 런타임 플래그로 cron/poller 활성화 제어

### RFC

- Process model hardening proposal:
  - (예: graceful shutdown, health/readiness 기준, 공통 env contract 문서화)

---

## 7. Infra / Deployment (Dependency-gated)

> Gate: 아래 Alignment 체크리스트가 **Green**이 되기 전에는 DR/RFC 결론을 작성하지 않습니다.

### Alignment checklist (must be Green before feedback)

- [ ] SAM CodeUri가 레포 구조와 일치하는지 확인: ../../infra/sam/template.yaml
- [ ] Lambda handler 문자열이 실제 빌드 산출물 경로와 일치하는지 확인
- [ ] PM2 실행 경로(`dist/src/main.js`)와 backend start-prod 경로(`dist/main`) 불일치 여부 정리: ../../ecosystem.dev.config.cjs, ../../apps/backend/package.json
- [ ] SQS FIFO / DLQ 로컬-클라우드 패리티 정의: ../../infra/sam/template.yaml, ../../tools/localstack/10-bootstrap-sqs.sh
- [ ] Lambda 런타임에서 cron/poller가 의도치 않게 켜지지 않도록 env 플래그 정책 정리: ../../ecosystem.dev.config.cjs

### DR (write after alignment)

- 

### RFC (write after alignment)

- 

---

## Appendix A. Evidence Index (high-signal anchors)

- Root guide: ../../README.md
- PM2 topology: ../../ecosystem.dev.config.cjs
- Local infra: ../../docker-compose.local.yml
- SAM template: ../../infra/sam/template.yaml
- OpenAPI: ../../packages/contracts/openapi.yaml
- Outbox module: ../../apps/backend/src/shared/outbox
- Ordering domain: ../../apps/backend/src/modules/ordering/domains
- Payments domain: ../../apps/backend/src/modules/payments/domains
- Inventory domain: ../../apps/backend/src/modules/inventory/domains
- Shipping domain: ../../apps/backend/src/modules/shipping/domains

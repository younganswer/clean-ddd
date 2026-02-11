# 데이터 흐름

이 문서는 본 저장소에서 반복적으로 등장하는 기술적 흐름(HTTP 처리, Outbox 기반 비동기 처리)을 소개합니다.

## HTTP 요청 흐름(개념)

```mermaid
sequenceDiagram
  autonumber
  participant Client
  participant HTTP as HTTP entrypoint
  participant App as Application layer
  participant Repo as Persistence (repo/ORM)
  participant DB as Database

  Client->>HTTP: HTTP request
  HTTP->>App: call use-case
  App->>Repo: load/change state
  Repo->>DB: query/transaction
  DB-->>Repo: results
  Repo-->>App: entities/records
  App-->>HTTP: response DTO
  HTTP-->>Client: HTTP response
```

## Outbox 디스패치 흐름(DB → 큐)

```mermaid
sequenceDiagram
  autonumber
  participant App as Application layer
  participant DB as Database
  participant Dispatcher as Outbox dispatcher
  participant SQS as SQS FIFO queue

  App->>DB: write application state
  App->>DB: insert outbox record
  Dispatcher->>DB: read pending outbox records
  Dispatcher->>SQS: send message (outboxId)
  Dispatcher->>DB: mark as dispatched
```

## 비동기 소비 흐름(큐 → 워커)

```mermaid
sequenceDiagram
  autonumber
  participant SQS as SQS FIFO queue
  participant Worker as Consumer (poller/Lambda)
  participant DB as Database
  participant Publisher as In-process event publishing

  SQS->>Worker: deliver message (outboxId)
  Worker->>DB: load outbox record
  Worker->>DB: idempotency check / record
  Worker->>Publisher: publish typed event
  Worker->>DB: mark processed / record result
```

## 관련 문서

- [Outbox 패턴](concepts/backend/outbox-pattern.md)
- [SQS FIFO와 멱등성](concepts/backend/sqs-fifo-and-idempotency.md)
- [RequestContext와 EntityManager](concepts/backend/request-context-and-entity-manager.md)

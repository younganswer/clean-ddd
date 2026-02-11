# clean-ddd backend ↔ camp-clean-ddd-sample 비교/갭 리포트

작성일: 2026-02-10

## 목적

- camp-clean-ddd-sample의 문서(docs/*.md)와 실제 코드 구조가 정합한지 확인
- clean-ddd의 backend 애플리케이션이 camp-clean-ddd-sample(특히 문서/가이드)와 **구조/관례/아키텍처 요소가 맞지 않는 지점**을 식별
- “무엇을 기준으로 맞춘다(문서 vs 실제 샘플 코드)”를 결정할 수 있도록 근거 제공

> 본 문서는 "코드를 고친다"가 아니라, **어떤 점이 다르고 어디를 맞춰야 하는지**를 정리합니다.

---

## 1) 큰 그림: 저장소 형태가 다름

### camp-clean-ddd-sample
- 단일 NestJS 앱 중심 구조
  - 루트에 `src/`, `tests/`, `test-utils/` 등 존재
  - 루트 `package.json`으로 실행/배포(PM2 스크립트 포함)

### clean-ddd
- pnpm workspace 기반 모노레포
  - backend는 `apps/backend/` 하위에 존재
  - frontend(`apps/frontend`), 계약(`packages/contracts`) 등 포함
  - 로컬 인프라(LocalStack + Postgres)와 serverless(AWS Lambda) 지향 요소 존재

**결론**: camp 문서가 설명하는 경로(`src/...`)를 clean-ddd에 그대로 적용하면 경로부터 불일치가 발생합니다.

---

## 2) 폴더 구조 정합성(문서 ↔ camp 코드 ↔ clean 코드)

camp 문서(특히 docs/프로젝트 구조 개요.md)는 다음 top-level 구조를 설명합니다:

- `src/common` (순수 유틸)
- `src/shared` (비즈니스 계약)
- `src/lib` (NestJS 기반 인프라 모듈)
- `src/modules` (도메인 구현)
- `src/bff` (BFF)
- `src/saga-orchestrator`
- `src/cron-jobs`

아래는 실제 존재 여부/상태를 비교한 요약입니다.

### 2.1 src/ 하위 top-level 폴더 비교

| 항목 | camp 문서 기대 | camp 실제 | clean-ddd backend 실제 |
|---|---:|---:|---:|
| `common/` | 있음 | 있음 (README 포함, 구성 풍부) | 있음 (구성 최소: guards/types/utils 중심) |
| `shared/` | 있음 (readers/outbox/types 포함) | 있음 (course/outbox/types 중심) | 있음 (inventory/ordering/payments/shipping/outbox + readers + sqs + idempotency) |
| `lib/` | 있음 (emitter/event-publisher/error/queue/storage 등) | 있음 (database/emitter/error/event-publisher/storage) | 있음 (database/queue/outbox/lambda) |
| `modules/` | 있음 | 있음 (예: course) | 있음 (ordering/payments/shipping/inventory) |
| `bff/` | 있음 | **없음** | 있음 (checkout/dashboard/order-detail/orders 등) |
| `saga-orchestrator/` | 있음 | 있음 (course-process) | 있음 (webhooks 등) |
| `cron-jobs/` | 있음 | 있음 | 있음 |

**핵심**
- camp 문서가 말하는 `bff/`는 camp 코드에는 없음(문서가 코드보다 앞서가거나, 샘플에서 제거된 상태로 보임)
- clean-ddd backend는 `bff/`가 존재하여 문서 구조에는 더 근접
- `lib/` 구성은 camp vs clean이 서로 다른 방향으로 분화

---

## 3) camp 문서 자체의 정확도(문서가 코드와 안 맞는 부분)

### 3.1 common/base vs common/bases 네이밍 불일치
- camp 문서 및 템플릿에서는 `common/base/`를 언급하는 경우가 있음
- camp 실제 코드는 `src/common/bases/base.entity.ts`를 사용
  - 예: `src/modules/course/infrastructure/schemas/course.schema.ts`에서 `BaseEntity`를 `src/common/bases/base.entity`로 import

=> 문서 템플릿/예제 경로가 camp 코드와 정확히 일치하지 않습니다.

### 3.2 bff 폴더가 camp 코드에 없음
- camp 루트 README 및 docs/프로젝트 구조 개요.md는 `bff/` 구조를 설명
- camp 실제 `src/`에는 `bff/` 디렉터리가 없음

=> 문서가 실제 샘플 코드와 불일치(문서 업데이트 필요 또는 bff 구현이 누락된 샘플).

### 3.3 shared/readers(Reader 패턴 계약) 부재
- docs/프로젝트 구조 개요.md는 `shared/readers/`를 포함한 Reader 패턴을 설명
- camp 실제 `src/shared`에는 `readers/` 디렉터리가 없음

=> 문서에서 설명하는 “도메인 간 데이터 조회 Reader 계약”이 샘플 코드에 반영되어 있지 않습니다.

### 3.4 lib/queue 설명 vs camp 실제
- docs/프로젝트 구조 개요.md는 `lib/queue`를 포함하는 구조를 제시
- camp 실제 `src/lib`에는 `queue/`가 없음 (database/emitter/error/event-publisher/storage 위주)

=> 문서 구조 예시와 camp 코드가 불일치.

### 3.5 shared/outbox 계약 vs 구현/도구(OutboxPoller 등)
- camp 문서의 “하이브리드 outbox” 설명은 `shared/outbox`에 poller/추상화까지 포함하는 구조를 제시
- camp 실제 `src/shared/outbox`에는 `i.event-publisher.ts`, `i.outbox.repository.ts`, `dto/`, `index.ts` 정도만 존재
  - poller abstract는 없음

=> 문서가 설명하는 outbox 구성요소가 camp 코드에 일부만 존재합니다.

---

## 4) clean-ddd backend가 camp 문서/샘플과 다른 지점

### 4.1 공통 문서(README) 정합성
- clean-ddd의 backend README(`apps/backend/README.md`)는 NestJS 기본 템플릿 형태로 남아 있음
- 반면 camp는 루트 README에서 Clean Architecture + CQRS + 문서 링크를 제공

=> clean-ddd backend는 “아키텍처/폴더 가이드 문서”가 camp 대비 부족하며, 신규 참여자가 구조를 추론해야 함.

### 4.2 common 구성의 차이(풍부한 common vs 최소 common)
- camp `src/common`은 abstracts/bases/decorators/consts/exceptions/interceptors/references 등 폭넓게 존재
- clean-ddd `src/common`은 guards/types/utils 중심

=> camp 문서가 전제하는 공통 추상화/기반 클래스(예: CronJobAbstract 계열)가 clean-ddd에는 존재하지 않음.

### 4.3 cron-jobs 구현 스타일 차이 (Bus 기반 vs 직접 서비스 호출)
- camp 예시: CronJob이 `QueryBus`/`CommandBus`를 사용하고 `MikroOrmCronJobAbstract`로 RequestContext를 제공받음
  - 예: `src/cron-jobs/jobs/course-outbox.job.ts`
- clean-ddd: outbox cron job이 `OutboxSweeper`(서비스)를 직접 호출
  - 예: `apps/backend/src/cron-jobs/jobs/outbox-dispatch.job.ts`

=> camp 문서의 “배치도 소비자이며 Command/Query Bus를 이용한다” 원칙과 clean-ddd 구현은 다름.

### 4.4 shared/outbox의 비중/구현 위치 차이
- camp: 도메인 모듈(course) 내부에 outbox repository가 있고, shared/outbox는 계약 성격이 강함
- clean-ddd: `shared/outbox` 자체가 application/domain/infrastructure/presentation/modules까지 포함하며 구현 비중이 큼

=> outbox를 "shared=계약"으로 둘지, "shared에 구현까지 둘지" 아키텍처 결이 달라짐.

### 4.5 lib 구성 차이
- camp lib: `database/emitter/error/event-publisher/storage`
- clean lib: `database/queue/outbox/lambda`
  - clean은 `@vendia/serverless-express` 기반 `lib/lambda/http.handler.ts` 등 serverless 런타임 구성이 존재

=> 문서가 말하는 lib 구성(특히 storage/emitter/error 등)과 clean-ddd는 맞지 않으며, clean은 Lambda 지향 요소가 추가됨.

### 4.6 shared/types 전략 차이
- camp는 `shared/types/*`에 enum/type을 대량으로 모음
- clean-ddd는 도메인별 `shared/{domain}/enums|dto|views...` 형태가 두드러지고, `shared/types` 루트는 없음

=> 타입/상수 관리 전략(집중 vs 도메인별 분산)이 다름.

### 4.7 모듈 내부 네이밍 차이 (entity vs aggregate)
- camp 문서/코드는 `CourseEntity` 등 `*.entity.ts` 중심
- clean-ddd는 도메인에서 aggregate를 `order.aggregate.ts`로 두고 클래스명도 `Order` 등으로 단순화

=> “파일명/클래스명 규약”이 문서 템플릿과 다르며, 신규 합류자가 문서 템플릿 그대로 적용하기 어려움.

---

## 5) "유사한데 다른" 부분(혼동 포인트)

### 5.1 CQRS 이벤트 핸들러 파일명 규칙
- camp: `*.event.handler.ts` 패턴이 존재
  - 예: `user-created.event.handler.ts`
- clean-ddd: `*.handler.ts` 패턴 사용
  - 예: `create-shipment-for-order-requested.handler.ts`

=> 도구/검색/온보딩에서 혼동될 수 있음.

### 5.2 모듈 등록 방식
- 둘 다 `app.default.ts`에서 Import 리스트를 구성하지만, camp는 `CqrsModule.forRoot()`를 사용
- clean-ddd는 `CqrsModule`을 직접 import

=> Nest/CQRS 모듈 초기화 방식 차이(버전/설정에 따른 차이 가능).

---

## 6) 권장 액션(정합화를 위한 선택지)

### 선택지 A: camp 문서를 기준으로 clean-ddd를 맞춘다
- clean-ddd에 문서가 전제하는 요소를 보강
  - `src/common`의 추상화(예: CronJobAbstract, RequestContext) 도입 여부 결정
  - `lib` 모듈 구성을 camp 문서에 맞게 정리(storage/emitter/error/event-publisher 등)
  - cron job은 가능하면 Bus 기반(QueryBus/CommandBus)으로 작성
  - shared/readers 계약을 문서 수준으로 정리(이미 clean에는 존재)
- 장점: 문서 기반 온보딩이 쉬움
- 단점: clean-ddd의 serverless/Lambda 지향과 충돌할 수 있음

### 선택지 B: clean-ddd의 현실(모노레포/서버리스)을 기준으로 문서를 업데이트한다
- camp 문서를 clean-ddd 현실에 맞게 재작성/포팅
  - 경로: `src/` 중심 설명 → `apps/backend/src/`로 변경
  - `bff`, `shared/readers`, `shared/outbox` 등 실제 clean 구조에 맞춰 문서화
  - outbox/cron job 원칙(버스 기반 vs 직접 호출)을 clean 방식에 맞게 명확화
- 장점: 코드와 문서가 일치
- 단점: camp 샘플과의 동일성은 낮아질 수 있음

### 선택지 C: camp 코드 자체를 문서에 맞게 확장(샘플 정합성 회복)
- camp-clean-ddd-sample에 문서에 있는 `bff/`, `shared/readers`, `lib/queue` 등을 추가해 “문서=샘플” 정합성을 높임
- 장점: 교육/가이드 레포로서 일관성
- 단점: clean-ddd 정합화와는 별개의 작업량 발생

---

## 7) 빠른 결론(의사결정용)

- camp 문서(docs)는 **아키텍처 청사진으로는 훌륭하지만**, camp 실제 코드와도 여러 군데에서 불일치가 있음
  - 대표: `bff/`, `shared/readers`, `lib/queue`, `common/base` 경로
- clean-ddd backend는 BFF, shared/readers, shared/outbox(구현 포함) 등 문서에서 말하는 일부 요소를 더 많이 갖고 있으나,
  - cron job의 Bus 사용 원칙, lib 모듈 구성, common 추상화 등은 camp 문서/샘플과 다름

**추천**: 먼저 "정답"을 정하세요.
- (1) camp 문서를 표준으로 삼을지
- (2) clean-ddd의 실제 운영 지향(serverless/모노레포)을 표준으로 삼을지

표준이 정해지면, 그 다음에 “문서 업데이트”와 “코드 구조 리팩토링”의 우선순위를 잡을 수 있습니다.

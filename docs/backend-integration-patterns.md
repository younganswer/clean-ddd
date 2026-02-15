# 백엔드 연동 패턴 (Backend Integration Patterns)

이 문서는 `clean-ddd`에서 도메인 간 연동을 다룰 때 사용하는 핵심 패턴을 정리합니다.

<br/>
<br/>

## 목차

1. [Reader 패턴](#reader-패턴)
2. [BFF 분리 기준](#bff-분리-기준)
3. [Saga 오케스트레이션 기준](#saga-오케스트레이션-기준)
4. [Hybrid Outbox 운영 모델](#hybrid-outbox-운영-모델)
5. [Bulk Command 처리 원칙](#bulk-command-처리-원칙)

<br/>
<br/>

## Reader 패턴

Reader는 도메인 간 조회를 직접 의존 대신 계약으로 끊어내는 방식입니다.

- 요청 도메인은 Reader 인터페이스만 의존합니다.
- 제공 도메인은 Reader 구현을 인프라 레이어에 둡니다.
- 조회 결과는 도메인 엔티티가 아닌 DTO 계약으로 반환합니다.

이 방식은 도메인 결합도를 낮추고 모듈 분리를 쉽게 만듭니다.

### Reader 적용 상세 규칙

Reader는 단순한 조회 편의가 아니라 도메인 경계를 보호하는 계약입니다.

- 인터페이스/DTO 계약은 `shared`에 둡니다.
- 구현체는 각 도메인의 인프라 레이어가 소유합니다(필요 시 중복 허용).
- 반환 모델은 Entity 전체가 아니라 "타 도메인에 필요한 최소 DTO"로 제한합니다.
- 테스트에서는 Reader를 mock 하여 도메인 규칙을 독립 검증합니다.

<br/>
<br/>

## BFF 분리 기준

BFF는 화면 조합 로직을 담당하는 경계입니다.

- 도메인 규칙: `modules/*`에 유지
- 화면 최적화 응답 조합: BFF에서 처리
- BFF는 여러 Query를 조합하지만 상태 변경 규칙을 소유하지 않습니다.

BFF는 다음 3개 레이어만 사용합니다.

- Presentation: 화면/API 진입점
- Application(Query 중심): 조회 조합 유스케이스
- Infrastructure(Reader): 각 도메인 조회 어댑터

즉, BFF에는 Domain 레이어를 두지 않고, 도메인 규칙은 기존 모듈에만 유지합니다.

<br/>
<br/>

## Saga 오케스트레이션 기준

여러 도메인 단계를 순차적으로 제어해야 할 때 Saga를 사용합니다.

- 도메인 내부 단일 흐름이면 도메인/애플리케이션 핸들러에서 해결
- 도메인 경계를 넘는 보상/재시도 흐름이면 Saga로 분리
- Saga는 정책 오케스트레이션을 담당하고, 실제 상태 변경은 각 도메인 Command로 위임합니다.

### Saga vs Domain Event Handler

| 구분      | Saga Orchestrator                           | Domain Event Handler                                            |
| --------- | ------------------------------------------- | --------------------------------------------------------------- |
| 역할      | 핵심 흐름의 순서/정합성 제어                | 특정 이벤트에 대한 반응형 처리                                  |
| 책임      | Happy path + 보상(rollback) 정책            | 알림/통계/로그 등 부가 작업                                     |
| 실패 영향 | 메인 트랜잭션 성공/실패에 직접 영향         | 메인 트랜잭션과 분리된 side effect                              |
| 기본 위치 | `src/service/backend/src/saga-orchestrator` | `src/service/backend/src/modules/*/application/events/handlers` |

선택 기준은 아래 두 가지입니다.

- 핵심 비즈니스 성공 조건을 좌우하면 Saga
- 실패해도 본 트랜잭션을 되돌릴 필요가 없으면 Domain Event Handler

<br/>
<br/>

## Hybrid Outbox 운영 모델

Hybrid Outbox는 즉시 처리성과 재처리 안정성을 함께 가져가기 위한 운영 모델입니다.

| 상태      | 의미                         | 다음 전이          |
| --------- | ---------------------------- | ------------------ |
| PENDING   | DB 기록 완료, 아직 큐 미전달 | PUBLISHED / FAILED |
| PUBLISHED | 큐 전달 완료                 | CONSUMED           |
| FAILED    | 전달 또는 소비 실패          | RETRY(PENDING)     |
| CONSUMED  | 소비 처리 완료               | 종료               |

핵심은 “상태 변경과 outbox 기록의 원자성”을 먼저 보장하고, 외부 전달은 재시도로 복구한다는 점입니다.

<br/>
<br/>

## Bulk Command 처리 원칙

- 대량 처리에서는 한 번에 모든 엔티티를 바꾸기보다 배치 단위를 명확히 나눕니다.
- 각 배치 단위는 독립적인 Command 경계로 처리하고, 실패 배치는 재처리 가능해야 합니다.
- cron/worker는 내부 구현을 우회하지 않고 Command/Query Bus를 통해서만 도메인을 호출합니다.

# backend

`src/service/backend`는 이 저장소에서 **Clean Architecture + DDD를 실제 코드 예시로 정리한 핵심 영역**입니다.

<br/>
<br/>

## 목차

1. [핵심 목표](#핵심-목표)
2. [핵심 개념](#핵심-개념)
3. [폴더별 책임 요약](#폴더별-책임-요약)
4. [Write(명령) 구현 순서](#write명령-구현-순서)
5. [Read(조회) 구현 순서](#read조회-구현-순서)
6. [소스 디렉터리 가이드](#소스-디렉터리-가이드)
7. [구현 확인 체크리스트](#구현-확인-체크리스트)
8. [기술 구현 관점 요약](#기술-구현-관점-요약)

<br/>
<br/>

## 핵심 목표

이 폴더가 지향하는 핵심은 **잦은 변경에도 강인한 구조를 만들고, 도메인 응집도는 높이고 결합도는 낮추는 것**입니다.

1. 인프라로부터 독립된 비즈니스 코어 확보 (DIP)

- 목표: DB, 저장소, 메시징 등 외부 환경이 바뀌어도 비즈니스 로직은 수정 없이 유지합니다.
- 실천: Domain/Application은 상세 기술이 아니라 포트(추상화 인터페이스)에 의존하고, 구현은 Infrastructure Adapter로 격리합니다.

2. 비즈니스 복잡도를 제어하는 풍부한 도메인 모델 (Rich Domain Model)

- 목표: 데이터만 옮기는 빈 모델(Anemic Model)을 지양하고, 규칙과 제약이 도메인 객체 내부에 응집되게 합니다.
- 실천: 상태 전이/검증 로직을 엔티티에 집중해 서비스 레이어 비대화를 방지하고 정합성을 강화합니다.

3. 팀 간 소통 비용 최소화 (Ubiquitous Language)

- 목표: 기획/개발/디자인이 같은 언어로 대화하고, 코드가 문서 역할을 하게 합니다.
- 실천: 기술 용어보다 도메인 용어를 메서드/유스케이스 이름에 반영해 의도를 명확히 유지합니다.

4. 비즈니스 규모에 대응하는 유연한 확장성 (Scalability)

- 목표: 현재 구조를 유지하면서도, 성장 시 특정 도메인을 분리 가능한 토대를 확보합니다.
- 실천: 경계(Bounded Context)와 의존성 방향을 명확히 설계해 도메인 단위 분리 비용을 줄입니다.

5. 아키텍처 수준의 보안 신뢰성 확보 (Security by Design)

- 목표: 단순 설정 중심 보안을 넘어, 구조 자체에서 요청 주체를 검증합니다.
- 실천: 인증/권한 검증을 엔트리포인트와 애플리케이션 경계 전반에 일관되게 통합합니다.

<br/>
<br/>

## 핵심 개념

- 도메인 규칙은 Domain에 응집시키고, 외부 기술은 Adapter로 분리합니다.
- 의존성은 항상 안쪽(도메인)으로 향하며, 바깥 레이어가 안쪽 포트를 구현합니다.
- 유스케이스는 Application에서 조합하되, 정책 소유권은 Domain에 둡니다.
- 실행 역할이 달라도(API/배치/워커) 동일한 애플리케이션 모델을 재사용합니다.

<br/>
<br/>

## 이 폴더에서 확인할 수 있는 것

- 경계(레이어/모듈)를 통해 의존성 방향을 통제하는 방법
- Command/Query/Event 흐름에서 애플리케이션 서비스의 책임 분리
- Outbox와 FIFO 큐를 이용한 비동기 일관성 패턴
- 서버리스 엔트리포인트(HTTP/SQS)와 앱 코어의 분리

<br/>
<br/>

## 폴더별 책임 요약

| 폴더                           | 역할            | 핵심 확인 포인트               |
| ------------------------------ | --------------- | ------------------------------ |
| `src/modules/*/presentation`   | HTTP 진입점     | DTO, Controller 경계           |
| `src/modules/*/application`    | 유스케이스 실행 | command/query/event handler    |
| `src/modules/*/domains`        | 비즈니스 규칙   | entity, repository interface   |
| `src/modules/*/infrastructure` | 기술 구현       | repository 구현, mapper/schema |
| `src/lib`                      | 런타임 어댑터   | lambda, queue, outbox 결합     |

<br/>
<br/>

## Write(명령) 구현 순서

1. 유스케이스 입력/출력을 먼저 정의합니다.
2. 도메인 규칙(엔티티/도메인 서비스)을 확정합니다.
3. repository interface를 정의/수정합니다.
4. infrastructure에서 영속 구현을 연결합니다.
5. command handler에서 유스케이스를 조합합니다.
6. controller 엔드포인트와 DTO를 연결합니다.
7. 비동기 발행이 필요한 경우 Outbox 경계를 거쳐 이벤트를 전달합니다.

권장 순서는 “도메인 규칙 → 애플리케이션 orchestration → 진입점”입니다.

<br/>
<br/>

## Read(조회) 구현 순서

1. query 입력/출력 모델을 정의합니다.
2. 조회 대상이 Aggregate Root인지 먼저 판별합니다.
3. Aggregate Root 조회는 repository를 우선 사용합니다.
4. 복합 조회/통계 조회는 조회 전용 접근을 선택합니다.
5. query handler에서 조회 흐름과 예외를 정리합니다.
6. controller에서 응답 DTO를 명확히 매핑합니다.

조회는 “조회 최적화”와 “도메인 규칙 변경 금지”를 동시에 만족해야 합니다.

추가 기준:

- 도메인 간 조회가 필요하면 Reader 계약 패턴을 우선 검토합니다.
- 배치/대량 조회는 단건 유스케이스를 무리하게 확장하지 않고 Bulk 단위로 분리합니다.

### DIP 구현 포인트

- Handler는 포트(Repository Interface)만 의존하고, 구현체 타입은 모릅니다.
- 구현 기술(SQL/Mongo/Queue)은 Infrastructure 어댑터로 격리합니다.
- 구현체 교체/추가는 모듈 DI 바인딩 변경으로 끝나야 합니다.
- Avatar 케이스도 핵심은 weak relation 자체가 아니라, `포트 -> 구현체` 의존성 역전 구조를 유지하는 데 있습니다.

<br/>
<br/>

## 소스 디렉터리 가이드

- [backend src 개요](src/README.md)
- [도메인 모듈(modules)](src/modules/README.md)
- [인프라 어댑터(lib)](src/lib/README.md)

<br/>
<br/>

## 구현 확인 체크리스트

- Controller/Handler/Domain/Infra 책임이 섞이지 않는지
- Outbox 경계에서 상태 변경과 비동기 발행이 일관되게 연결되는지
- 런타임 역할(HTTP/Cron/Worker) 분리가 코드 경계를 깨지 않는지
- Write/Read에서 repository 책임이 과도하게 섞이지 않았는지
- Query 로직이 상태 변경을 유발하지 않는지
- cron/worker가 내부 구현을 직접 호출하지 않고 Bus 경계를 지키는지
- 도메인 간 조회가 직접 의존 대신 Reader 계약으로 분리되어 있는지

<br/>
<br/>

## 기술 구현 관점 요약

동일 코드베이스가 실행 역할(role)에 따라 다른 진입점으로 동작합니다.

- HTTP API
- cron/scheduler
- queue worker(SQS poller)

이 구조는 “진입점은 다르지만, 애플리케이션/도메인 코어는 공통으로 재사용”하는 패턴을 실제 운영 관점에서 정리합니다.

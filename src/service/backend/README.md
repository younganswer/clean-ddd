# backend

`src/service/backend`는 이 저장소에서 **Clean Architecture + DDD를 실제 코드 예시로 정리한 핵심 영역**입니다.

<br/>
<br/>

## 목차

1. [핵심 목표](#핵심-목표)
2. [이 폴더에서 확인할 수 있는 것](#이-폴더에서-확인할-수-있는-것)
3. [폴더별 책임 요약](#폴더별-책임-요약)
4. [Write(명령) 구현 순서](#write명령-구현-순서)
5. [Read(조회) 구현 순서](#read조회-구현-순서)
6. [소스 디렉터리 가이드](#소스-디렉터리-가이드)
7. [구현 확인 체크리스트](#구현-확인-체크리스트)
8. [실행 관점 요약](#실행-관점-요약)

<br/>
<br/>

## 핵심 목표

핵심 정리 포인트는 아래 두 가지입니다.

- 기술 프레임워크(NestJS/ORM/Queue)가 바뀌어도, 핵심 비즈니스 규칙이 쉽게 흔들리지 않는 구조 만들기
- 동기 요청(HTTP)과 비동기 처리(SQS/Outbox)를 하나의 일관된 애플리케이션 모델로 다루기

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

## 실행 관점 요약

동일 코드베이스가 실행 역할(role)에 따라 다른 진입점으로 동작합니다.

- HTTP API
- cron/scheduler
- queue worker(SQS poller)

이 구조는 “진입점은 다르지만, 애플리케이션/도메인 코어는 공통으로 재사용”하는 패턴을 실제 운영 관점에서 정리합니다.

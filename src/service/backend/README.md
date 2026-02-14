# backend

`src/service/backend`는 이 저장소에서 **Clean Architecture + DDD를 실제 코드 예시로 정리한 핵심 영역**입니다.

핵심 정리 포인트는 아래 두 가지입니다.

- 기술 프레임워크(NestJS/ORM/Queue)가 바뀌어도, 핵심 비즈니스 규칙이 쉽게 흔들리지 않는 구조 만들기
- 동기 요청(HTTP)과 비동기 처리(SQS/Outbox)를 하나의 일관된 애플리케이션 모델로 다루기

## 이 폴더에서 확인할 수 있는 것

- 경계(레이어/모듈)를 통해 의존성 방향을 통제하는 방법
- Command/Query/Event 흐름에서 애플리케이션 서비스의 책임 분리
- Outbox와 FIFO 큐를 이용한 비동기 일관성 패턴
- 서버리스 엔트리포인트(HTTP/SQS)와 앱 코어의 분리

## 빠른 확인 경로

1. [백엔드 개념 문서 허브](../../../docs/concepts/backend/index.md)
2. [프로세스 모델](../../../docs/concepts/backend/process-model.md)
3. [Outbox 패턴(본 저장소 구현)](../../../docs/concepts/backend/outbox-pattern.md)
4. [테스트 전략](../../../docs/concepts/backend/testing-strategy.md)

## 소스 디렉터리 가이드

- [backend src 개요](src/README.md)
- [도메인 모듈(modules)](src/modules/README.md)
- [인프라 어댑터(lib)](src/lib/README.md)

## 구현 확인 체크리스트

- Controller/Handler/Domain/Infra 책임이 섞이지 않는지
- Outbox 경계에서 상태 변경과 비동기 발행이 일관되게 연결되는지
- 런타임 역할(HTTP/Cron/Worker) 분리가 코드 경계를 깨지 않는지

## 실행 관점 요약

동일 코드베이스가 실행 역할(role)에 따라 다른 진입점으로 동작합니다.

- HTTP API
- cron/scheduler
- queue worker(SQS poller)

이 구조는 “진입점은 다르지만, 애플리케이션/도메인 코어는 공통으로 재사용”하는 패턴을 실제 운영 관점에서 정리합니다.

## 관련 문서

- 전체 문서 허브: [../../../docs/index.md](../../../docs/index.md)
- 백엔드 개념 문서 묶음(기준): [../../../docs/concepts/backend/index.md](../../../docs/concepts/backend/index.md)

# 프로세스 모델

이 저장소의 백엔드는 동일한 코드베이스가 여러 실행 역할(role)로 동작하도록 구성되어 있습니다.

## 개요

개발 환경에서는 Docker Compose가 아래 역할을 각각 별도 컨테이너로 실행합니다.

- HTTP API: 요청을 받아 응답을 반환합니다.
- Cron/Scheduler: 주기적으로 실행되는 작업을 수행합니다.
- Queue Poller: SQS를 폴링하여 메시지를 소비합니다.

## 이 저장소에서의 형태

역할 분리는 Compose 서비스 단위로 이뤄집니다.

- 기본 정의: `src/stack/compose/docker-compose.yml`
- 개발용 override: `src/stack/compose/docker-compose.dev.yml`

각 컨테이너는 환경변수로 역할을 구분합니다.

- `PORT_LISTEN`: HTTP 포트 리스닝 여부
- `OUTBOX_CRON_ENABLED`: Outbox 디스패치/스케줄러 역할 활성화 여부
- `OUTBOX_POLLING_ENABLED`: SQS 폴링(워커) 역할 활성화 여부

이 방식은 코드 관점에서 “하나의 애플리케이션”을 유지하면서도, 런타임 역할을 분리하는 형태로 이해할 수 있습니다.

## 함께 읽기

- [런타임 토폴로지](../../runtime-topology.md)
- [데이터 흐름](../../data-flows.md)
- [Outbox 패턴(본 저장소 구현)](outbox-pattern.md)

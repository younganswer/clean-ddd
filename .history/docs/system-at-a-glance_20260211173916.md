# 시스템 한눈에 보기

이 문서는 저장소의 큰 구성과 주요 런타임 컴포넌트를 소개합니다.

## 저장소 레이아웃

- `apps/backend`: NestJS 백엔드입니다. 동일한 코드가 여러 역할(HTTP API, cron/scheduler, queue poller)로 실행됩니다.
- `apps/frontend`: Next.js 기반 어드민 UI입니다(정적 export).
- `packages/contracts`: API 계약(OpenAPI) 및 통합을 위한 공유 타입입니다. 도메인 객체는 공유하지 않습니다.
- `infra`: AWS 인프라 템플릿(SAM)입니다.
- `tools`: LocalStack 부트스트랩 스크립트 등 로컬 개발 도구입니다.

## 핵심 아이디어(기술)

### HTTP와 비동기 처리

이 시스템은 크게 두 실행 모드를 함께 사용합니다.

- HTTP 요청/응답: 운영에서는 API Gateway + Lambda, 로컬에서는 포트 리스너로 동작합니다.
- 비동기 처리: SQS FIFO 큐를 사용하며, Outbox 디스패처가 메시지를 생성하고 워커가 소비합니다.

### Outbox는 브리지

Outbox는 “나중에 처리할 일”을 먼저 DB에 기록한 다음, 큐(SQS)로 디스패치하는 방식으로 연결점을 제공합니다.

## 다음 문서

- 런타임 형태와 프로세스: [런타임 토폴로지](runtime-topology.md)
- 주요 흐름: [데이터 흐름](data-flows.md)
- 시각적 탐색: [컨셉 맵](concept-map.md)

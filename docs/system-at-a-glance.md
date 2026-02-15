# 시스템 한눈에 보기

이 문서는 저장소의 큰 구성과 주요 런타임 컴포넌트를 소개합니다.

<br/>
<br/>

## 저장소 레이아웃

- `src/service/backend`: NestJS 백엔드입니다. 동일한 코드가 여러 역할(HTTP API, cron/scheduler, queue poller)로 실행됩니다.
- `src/service/frontend`: Next.js 기반 어드민 UI입니다(정적 export).
- `src/packages/contracts`: API 계약(OpenAPI) 및 통합을 위한 공유 타입입니다. 도메인 객체는 공유하지 않습니다.
- `src/infra`: AWS 인프라 템플릿(SAM) 및 운영 배포 관련 정의를 둡니다.
- `src/stack/localstack`: LocalStack 초기화 스크립트 및 로컬 개발 도구 문서가 있습니다.

<br/>
<br/>

## 핵심 아이디어(기술)

### HTTP와 비동기 처리

이 시스템은 크게 두 실행 모드를 함께 사용합니다.

- HTTP 요청/응답: 운영에서는 API Gateway + Lambda, 로컬에서는 포트 리스너로 동작합니다.
- 비동기 처리: SQS FIFO 큐를 사용하며, Outbox 디스패처가 메시지를 생성하고 워커가 소비합니다.

### Outbox는 브리지

Outbox는 “나중에 처리할 일”을 먼저 DB에 기록한 다음, 큐(SQS)로 디스패치하는 방식으로 연결점을 제공합니다.

### Contracts는 통합 경계

`src/packages/contracts`는 OpenAPI 스펙과 생성 타입을 통해 "외부 통합 언어"를 관리합니다.

- contracts에는 API 요청/응답 스키마만 둡니다.
- Domain Entity/Value Object는 contracts로 내보내지 않습니다.
- 즉, 통합 모델과 도메인 모델을 분리해 도메인 변경 파급을 줄입니다.

<br/>
<br/>

## 비핵심 영역 요약

- Frontend: Next.js 정적 export 기반으로 빌드 결과물을 정적 호스팅(S3+CloudFront)하는 모델을 사용합니다.
- Contracts: 통합 경계에서 공유되는 OpenAPI/공용 타입을 `src/packages/contracts`에 유지합니다.
- Infra: SAM 템플릿은 API Gateway/Lambda/SQS 리소스와 백엔드 핸들러를 연결합니다.

Contracts를 통해 클라이언트/타 서비스가 참조하는 형태를 고정하되, 내부 도메인 모델은 모듈 내부에서 독립적으로 진화시키는 것이 원칙입니다.

<br/>
<br/>

## 구조 확장 관점

- 기본 단위는 Modular Monolith이며, 도메인 경계를 기준으로 향후 분리 가능성을 확보합니다.
- 도메인 간 조회는 Reader 계약을 통해 결합도를 낮춥니다.
- 화면 최적화 응답 조합은 BFF 경계에서 처리하고, 도메인 규칙은 모듈 내부에 유지합니다.
